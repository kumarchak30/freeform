import { useEffect, useRef, useCallback } from 'react'
import useStore from '../store/useStore'

export default function useAudio() {
  const audioRef    = useRef(null)
  const contextRef  = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef   = useRef(null)

  const songs         = useStore(s => s.songs)
  const currentSongId = useStore(s => s.currentSongId)
  const isPlaying     = useStore(s => s.isPlaying)
  const nextSong      = useStore(s => s.nextSong)
  const setIsPlaying  = useStore(s => s.setIsPlaying)
  const updateSongMeta = useStore(s => s.updateSongMeta)

  const currentSong = songs.find(s => s.id === currentSongId) ?? null

  // Resume AudioContext — called whenever the context might be suspended
  const resumeContext = useCallback(() => {
    const ctx = contextRef.current
    if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {})
  }, [])

  // Init audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.crossOrigin = 'anonymous'
    }
    const audio = audioRef.current

    const onEnded = () => {
      if (useStore.getState().loopMode === 'one') {
        audio.currentTime = 0
        audio.play()
      } else {
        nextSong()
      }
    }

    // OS interrupted audio (screen lock, phone call, etc.) — resume if we should be playing
    const onPause = () => {
      const { isPlaying } = useStore.getState()
      if (isPlaying) {
        // Small delay — let the OS settle before trying to resume
        setTimeout(() => {
          resumeContext()
          audio.play().catch(() => {})
        }, 300)
      }
    }

    audio.addEventListener('ended', onEnded)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('pause', onPause)
    }
  }, [nextSong, resumeContext])

  // Build Web Audio graph once on first play
  const ensureAudioGraph = useCallback(() => {
    if (contextRef.current) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    const source = ctx.createMediaElementSource(audioRef.current)
    source.connect(analyser)
    analyser.connect(ctx.destination)
    contextRef.current = ctx
    analyserRef.current = analyser
    sourceRef.current = source

    // Auto-resume whenever the context is suspended unexpectedly
    ctx.addEventListener('statechange', () => {
      if (ctx.state === 'suspended' && useStore.getState().isPlaying) {
        ctx.resume().catch(() => {})
      }
    })
  }, [])

  // Swap src when song changes
  useEffect(() => {
    if (!currentSong) return
    const audio = audioRef.current
    if (audio.src !== currentSong.url) {
      audio.src = currentSong.url
      audio.load()
    }
    const onMeta = () => updateSongMeta(currentSong.id, { duration: audio.duration })
    audio.addEventListener('loadedmetadata', onMeta)
    return () => audio.removeEventListener('loadedmetadata', onMeta)
  }, [currentSong?.id])

  // Play / pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentSong) return
    if (isPlaying) {
      ensureAudioGraph()
      resumeContext()
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying, currentSong?.id])

  // Resume AudioContext when tab/app becomes visible again (screen unlock)
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && useStore.getState().isPlaying) {
        resumeContext()
        audioRef.current?.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [resumeContext])

  // iOS: resume on any user interaction in case context was suspended
  useEffect(() => {
    const onInteraction = () => resumeContext()
    window.addEventListener('touchstart', onInteraction, { passive: true })
    window.addEventListener('touchend',   onInteraction, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onInteraction)
      window.removeEventListener('touchend',   onInteraction)
    }
  }, [resumeContext])

  return { audioRef, analyserRef }
}
