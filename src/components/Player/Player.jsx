import { useEffect, useRef, useState, useCallback } from 'react'
import useStore from '../../store/useStore'
import Visualizer from '../Visualizer/Visualizer'

function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function AddToPlaylistPopover({ songId, onClose }) {
  const playlists = useStore(s => s.playlists)
  const addSongToPlaylist = useStore(s => s.addSongToPlaylist)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [onClose])

  return (
    <div ref={ref} style={{
      position: 'absolute',
      bottom: 'calc(100% + 10px)',
      right: 0,
      background: '#13102a',
      border: '1px solid var(--border2)',
      borderRadius: 10,
      padding: 6,
      minWidth: 180,
      boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
      zIndex: 50,
      animation: 'fadeIn 0.1s ease',
    }}>
      <div style={{ padding: '4px 12px 6px', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text3)' }}>
        Add to Playlist
      </div>
      {playlists.length === 0 && (
        <div style={{ padding: '6px 12px', color: 'var(--text3)', fontSize: 12 }}>No playlists yet</div>
      )}
      {playlists.map(pl => (
        <div
          key={pl.id}
          className="ctx-item"
          onClick={() => { addSongToPlaylist(pl.id, songId); onClose() }}
        >
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: pl.color, marginRight: 8 }} />
          {pl.name}
        </div>
      ))}
    </div>
  )
}

export default function Player({ audioRef, analyserRef }) {
  const songs         = useStore(s => s.songs)
  const currentSongId = useStore(s => s.currentSongId)
  const isPlaying     = useStore(s => s.isPlaying)
  const shuffleOn     = useStore(s => s.shuffleOn)
  const loopMode      = useStore(s => s.loopMode)
  const togglePlay    = useStore(s => s.togglePlay)
  const nextSong      = useStore(s => s.nextSong)
  const prevSong      = useStore(s => s.prevSong)
  const toggleShuffle = useStore(s => s.toggleShuffle)
  const cycleLoop     = useStore(s => s.cycleLoop)
  const setIsPlaying  = useStore(s => s.setIsPlaying)

  const currentSong = songs.find(s => s.id === currentSongId) ?? null

  const [progress, setProgress] = useState(0)
  const [volume, setVolume]     = useState(0.8)
  const [dragging, setDragging] = useState(false)
  const [showAddTo, setShowAddTo] = useState(false)
  const progressRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => {
      if (!dragging && audio.duration) setProgress(audio.currentTime / audio.duration)
    }
    audio.addEventListener('timeupdate', onTime)
    return () => audio.removeEventListener('timeupdate', onTime)
  }, [dragging])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const seekTo = useCallback((clientX) => {
    const bar = progressRef.current
    if (!bar || !audioRef.current?.duration) return
    const rect  = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    audioRef.current.currentTime = ratio * audioRef.current.duration
    setProgress(ratio)
  }, [])

  const onMouseDown = (e) => {
    setDragging(true)
    seekTo(e.clientX)
    const onMove = (ev) => seekTo(ev.clientX)
    const onUp   = () => { setDragging(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const duration    = audioRef.current?.duration || currentSong?.duration || 0
  const currentTime = (progress * duration) || 0

  return (
    <div className="player">
      {/* Left: song info */}
      <div className="player-song-info">
        <div className="player-art">
          <div className="player-art-pulse" />
          <span style={{ position: 'relative', zIndex: 1 }}>♪</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="player-song-name">{currentSong?.name ?? 'No song selected'}</div>
          <div className="player-song-artist">{currentSong?.artist ?? '—'}</div>
        </div>
      </div>

      {/* Center: controls + progress */}
      <div className="player-controls">
        <div className="player-buttons">
          <button className={`ctrl-btn${shuffleOn ? ' active' : ''}`} title="Shuffle" onClick={toggleShuffle}>
            <ShuffleIcon />
          </button>

          <button className="ctrl-btn" title="Previous" onClick={prevSong}>
            <PrevIcon />
          </button>

          <button className="ctrl-btn ctrl-btn-play" title={isPlaying ? 'Pause' : 'Play'} onClick={togglePlay}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button className="ctrl-btn" title="Next" onClick={nextSong}>
            <NextIcon />
          </button>

          <button
            className={`ctrl-btn${loopMode !== 'none' ? ' active' : ''}`}
            title="Loop (click: loop all · click again: loop one)"
            onClick={cycleLoop}
            style={{ position: 'relative' }}
          >
            <LoopIcon />
            {loopMode === 'one' && <span className="loop-one-badge">1</span>}
          </button>

          {/* Add to playlist */}
          <div style={{ position: 'relative' }}>
            <button
              className={`ctrl-btn${showAddTo ? ' active' : ''}`}
              title="Add to playlist"
              onClick={() => setShowAddTo(v => !v)}
              disabled={!currentSongId}
              style={{ opacity: currentSongId ? 1 : 0.35 }}
            >
              <AddIcon />
            </button>
            {showAddTo && currentSongId && (
              <AddToPlaylistPopover songId={currentSongId} onClose={() => setShowAddTo(false)} />
            )}
          </div>
        </div>

        <div className="progress-row">
          <span className="progress-time">{fmt(currentTime)}</span>
          <div
            ref={progressRef}
            className="progress-bar-wrap"
            onClick={e => seekTo(e.clientX)}
            onMouseDown={onMouseDown}
          >
            <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
            <div className="progress-thumb" style={{ left: `${progress * 100}%` }} />
          </div>
          <span className="progress-time right">{fmt(duration)}</span>
        </div>
      </div>

      {/* Right: visualizer + volume */}
      <div className="player-right">
        <Visualizer analyserRef={analyserRef} />
        <div className="volume-row">
          <VolumeIcon muted={volume === 0} />
          <input
            type="range" className="volume-slider"
            min={0} max={1} step={0.01}
            value={volume}
            onChange={e => setVolume(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  )
}

/* ── Icons ── */
const PlayIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
const PauseIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
const PrevIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
const NextIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2-8.14 5.5 2.14L8 14.14V9.86zM16 6h2v12h-2z"/></svg>
const ShuffleIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
const LoopIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
const AddIcon     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
const VolumeIcon  = ({ muted }) => muted
  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{color:'var(--text3)'}}><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>
  : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{color:'var(--text3)'}}><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
