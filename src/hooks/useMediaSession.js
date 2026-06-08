import { useEffect } from 'react'
import useStore from '../store/useStore'

export default function useMediaSession(audioRef) {
  const songs        = useStore(s => s.songs)
  const currentSongId = useStore(s => s.currentSongId)
  const isPlaying    = useStore(s => s.isPlaying)
  const togglePlay   = useStore(s => s.togglePlay)
  const nextSong     = useStore(s => s.nextSong)
  const prevSong     = useStore(s => s.prevSong)

  const currentSong = songs.find(s => s.id === currentSongId) ?? null

  // Update metadata (song title, artist → shows on lock screen)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    if (!currentSong) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title:  currentSong.name   ?? 'Unknown',
      artist: currentSong.artist ?? 'Unknown Artist',
      album:  currentSong.album  ?? '',
      artwork: [
        { src: '/freeform/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/freeform/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    })
  }, [currentSong?.id])

  // Update playback state (tells OS whether to show play or pause on lock screen)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [isPlaying])

  // Register lock screen control handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    const handlers = {
      play:           () => { if (!isPlaying) togglePlay() },
      pause:          () => { if (isPlaying)  togglePlay() },
      nexttrack:      () => nextSong(),
      previoustrack:  () => prevSong(),
      stop:           () => { if (isPlaying) togglePlay() },
      seekbackward:   () => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10) },
      seekforward:    () => { if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration ?? 0, audioRef.current.currentTime + 10) },
    }

    for (const [action, handler] of Object.entries(handlers)) {
      try { navigator.mediaSession.setActionHandler(action, handler) } catch {}
    }

    return () => {
      for (const action of Object.keys(handlers)) {
        try { navigator.mediaSession.setActionHandler(action, null) } catch {}
      }
    }
  }, [isPlaying, nextSong, prevSong, togglePlay])

  // Keep position state in sync (enables seek bar on lock screen on some devices)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return
    const audio = audioRef.current
    if (!audio) return

    const update = () => {
      if (!audio.duration || isNaN(audio.duration)) return
      try {
        navigator.mediaSession.setPositionState({
          duration:     audio.duration,
          playbackRate: audio.playbackRate,
          position:     audio.currentTime,
        })
      } catch {}
    }

    audio.addEventListener('timeupdate', update)
    return () => audio.removeEventListener('timeupdate', update)
  }, [currentSong?.id])
}
