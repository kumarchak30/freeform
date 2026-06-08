import { useEffect, useRef, useCallback } from 'react'
import useStore from '../store/useStore'

export default function useAudio() {
  const audioRef = useRef(null)
  const contextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)

  const songs = useStore(s => s.songs)
  const currentSongId = useStore(s => s.currentSongId)
  const isPlaying = useStore(s => s.isPlaying)
  const loopMode = useStore(s => s.loopMode)
  const nextSong = useStore(s => s.nextSong)
  const setIsPlaying = useStore(s => s.setIsPlaying)
  const updateSongMeta = useStore(s => s.updateSongMeta)

  const currentSong = songs.find(s => s.id === currentSongId) ?? null

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
    audio.addEventListener('ended', onEnded)
    return () => audio.removeEventListener('ended', onEnded)
  }, [nextSong])

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
  }, [])

  // Swap src when song changes
  useEffect(() => {
    if (!currentSong) return
    const audio = audioRef.current
    if (audio.src !== currentSong.url) {
      audio.src = currentSong.url
      audio.load()
    }
    // Read duration after metadata loads
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
      if (contextRef.current?.state === 'suspended') contextRef.current.resume()
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying, currentSong?.id])

  return { audioRef, analyserRef }
}
