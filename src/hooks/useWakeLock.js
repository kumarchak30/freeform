import { useEffect, useRef } from 'react'
import useStore from '../store/useStore'

export default function useWakeLock() {
  const isPlaying = useStore(s => s.isPlaying)
  const lockRef   = useRef(null)

  const acquire = async () => {
    if (!('wakeLock' in navigator)) return
    try {
      lockRef.current = await navigator.wakeLock.request('screen')
    } catch (e) {
      // Low battery or permission denied — fail silently
    }
  }

  const release = async () => {
    if (lockRef.current) {
      await lockRef.current.release().catch(() => {})
      lockRef.current = null
    }
  }

  // Acquire when playing, release when paused
  useEffect(() => {
    if (isPlaying) acquire()
    else release()
    return release
  }, [isPlaying])

  // Reacquire after tab becomes visible again (e.g. user unlocks phone)
  useEffect(() => {
    const onVisible = () => { if (isPlaying) acquire() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [isPlaying])
}
