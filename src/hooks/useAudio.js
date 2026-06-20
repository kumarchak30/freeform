import { useEffect, useRef } from 'react'
import useStore from '../store/useStore'

export default function useAudio() {
  const audioRef    = useRef(null)
  const analyserRef = useRef(null) // always null — visualizer uses idle animation

  const songs          = useStore(s => s.songs)
  const currentSongId  = useStore(s => s.currentSongId)
  const isPlaying      = useStore(s => s.isPlaying)
  const nextSong       = useStore(s => s.nextSong)
  const setIsPlaying   = useStore(s => s.setIsPlaying)
  const updateSongMeta = useStore(s => s.updateSongMeta)

  const currentSong = songs.find(s => s.id === currentSongId) ?? null

  // Init audio element once
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio()
      audio.crossOrigin = 'anonymous'
      audio.preload = 'metadata'
      audioRef.current = audio
    }
    const audio = audioRef.current

    const onEnded = () => {
      const state = useStore.getState()

      if (state.loopMode === 'one') {
        audio.currentTime = 0
        audio.play().catch(() => {})
        return
      }

      // Update the store (shuffles queue, advances index, etc.)
      state.nextSong()

      // iOS may have throttled React's render cycle — drive audio imperatively
      // so the next song starts immediately without waiting for a re-render
      setTimeout(() => {
        const next = useStore.getState()
        const song = next.songs.find(s => s.id === next.currentSongId)
        if (!song || !next.isPlaying) return
        if (audio.src !== song.url) {
          audio.src = song.url
          audio.load()
        }
        audio.addEventListener('canplay', () => audio.play().catch(() => {}), { once: true })
      }, 0)
    }

    // OS interrupted playback (screen lock, phone call) — resume if we should still be playing
    const onPause = () => {
      if (useStore.getState().isPlaying) {
        setTimeout(() => audio.play().catch(() => {}), 300)
      }
    }

    audio.addEventListener('ended', onEnded)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('pause', onPause)
    }
  }, []) // empty deps — all state read live from store inside handlers

  // Swap src when song changes (handles UI-driven changes: clicking a song, prev/next from lock screen)
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
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying, currentSong?.id])

  // Retry when page becomes visible again (screen unlock)
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && useStore.getState().isPlaying) {
        audioRef.current?.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  return { audioRef, analyserRef }
}
