import { useState, useCallback } from 'react'
import useStore from '../../store/useStore'
import ContextMenu from './ContextMenu'

function fmt(sec) {
  if (!sec || isNaN(sec)) return '—'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function SongTable({ songs, songPool, playlistId, draggable }) {
  const currentSongId = useStore(s => s.currentSongId)
  const isPlaying     = useStore(s => s.isPlaying)
  const playSong      = useStore(s => s.playSong)
  const reorderPlaylist = useStore(s => s.reorderPlaylist)

  const [ctx, setCtx] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [dragSrc, setDragSrc] = useState(null)

  const openCtx = useCallback((e, songId) => {
    e.preventDefault()
    setCtx({ x: e.clientX, y: e.clientY, songId })
  }, [])

  const play = (songId) => playSong(songId, songPool ?? songs.map(s => s.id))

  // Drag-to-reorder (playlist only)
  const onDragStart = (e, i) => { setDragSrc(i); e.dataTransfer.effectAllowed = 'move' }
  const onDragOver  = (e, i) => { e.preventDefault(); setDragOver(i) }
  const onDrop      = (e, i) => {
    e.preventDefault()
    if (dragSrc !== null && dragSrc !== i && playlistId) {
      reorderPlaylist(playlistId, dragSrc, i)
    }
    setDragSrc(null); setDragOver(null)
  }
  const onDragEnd = () => { setDragSrc(null); setDragOver(null) }

  return (
    <>
      <table className="song-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>#</th>
            <th>Title</th>
            <th>Artist</th>
            <th>Album</th>
            <th style={{ textAlign: 'right', paddingRight: 12 }}>Duration</th>
            <th style={{ width: 60 }} />
          </tr>
        </thead>
        <tbody>
          {songs.map((song, i) => {
            const active = song.id === currentSongId
            const isOver = dragOver === i
            return (
              <tr
                key={song.id}
                className={`song-row${active ? ' active' : ''}`}
                style={isOver ? { outline: '1px solid var(--accent)', outlineOffset: -1 } : undefined}
                onDoubleClick={() => play(song.id)}
                onContextMenu={e => openCtx(e, song.id)}
                draggable={!!draggable}
                onDragStart={e => onDragStart(e, i)}
                onDragOver={e => onDragOver(e, i)}
                onDrop={e => onDrop(e, i)}
                onDragEnd={onDragEnd}
              >
                <td className="song-num">
                  {active && isPlaying
                    ? <span className="song-active-indicator">▶</span>
                    : <span>{i + 1}</span>
                  }
                </td>
                <td className="song-name">{song.name}</td>
                <td className="song-artist">{song.artist}</td>
                <td className="song-album">{song.album}</td>
                <td className="song-duration">{fmt(song.duration)}</td>
                <td>
                  <div className="song-actions">
                    <button
                      className="song-action-btn"
                      title="Play"
                      onClick={() => play(song.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {ctx && (
        <ContextMenu
          x={ctx.x}
          y={ctx.y}
          songId={ctx.songId}
          playlistId={playlistId}
          onClose={() => setCtx(null)}
        />
      )}
    </>
  )
}
