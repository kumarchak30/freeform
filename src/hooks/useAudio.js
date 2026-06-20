import { useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { recordPlay } from '../reform'

export default function useAudio() {
  const audioRef      = useRef(null)
  const analyserRef   = useRef(null)  // always null — visualizer uses idle animation
  const switchingRef  = useRef(false) // guard: prevent double-transition
  const playCountedRef = useRef(false) // guard: count each song play once

  const songs          = useStore(s => s.songs)
  const currentSongId  = useStore(s => s.currentSongId)
  const isPlaying      = useStore(s => s.isPlaying)
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

    // Advance to the next song while audio is still "playing".
    // iOS allows play() on a new src if the element is currently in playing state —
    // it treats it as a continuation. Calling play() after onEnded is treated as
    // a new request and gets silently blocked in background.
    const advance = () => {
      const state = useStore.getState()

      if (state.loopMode === 'one') {
        audio.currentTime = 0
        audio.play().catch(() => {})
        switchingRef.current = false
        return
      }

      state.nextSong()

      const next = useStore.getState()
      const song = next.songs.find(s => s.id === next.currentSongId)
      if (!song || !next.isPlaying) {
        switchingRef.current = false
        return
      }

      audio.src = song.url
      // play() immediately — don't wait for canplay, keeps iOS happy
      audio.play().catch(() => {})
      // Reset guard after new song is underway
      setTimeout(() => { switchingRef.current = false }, 3000)
    }

    // Primary: fire ~0.5s before end, while still in "playing" state
    // Also record a play after 10s (avoids counting skips)
    const onTimeUpdate = () => {
      const { duration, currentTime } = audio
      if (!duration || isNaN(duration)) return

      if (!playCountedRef.current && currentTime >= 10) {
        playCountedRef.current = true
        const state = useStore.getState()
        const playlistId = state.view === 'library' || state.view === 'reform' ? 'library' : state.view
        recordPlay(state.currentSongId, playlistId)
      }

      if (switchingRef.current) return
      if (duration - currentTime > 0.5) return
      switchingRef.current = true
      advance()
    }

    // Fallback: if timeupdate somehow missed it
    const onEnded = () => {
      if (switchingRef.current) return
      switchingRef.current = true
      advance()
    }

    // OS interrupted playback (screen lock, phone call) — resume if we should still be playing
    const onPause = () => {
      if (useStore.getState().isPlaying && !switchingRef.current) {
        setTimeout(() => audio.play().catch(() => {}), 300)
      }
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('pause', onPause)
    }
  }, [])

  // Swap src when song changes via UI (clicking a song, lock screen prev/next)
  useEffect(() => {
    if (!currentSong) return
    const audio = audioRef.current
    if (audio.src !== currentSong.url) {
      switchingRef.current = false
      playCountedRef.current = false // reset play count for new song
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
