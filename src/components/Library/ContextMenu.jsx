import { useEffect, useRef } from 'react'
import useStore from '../../store/useStore'

export default function ContextMenu({ x, y, songId, playlistId, onClose }) {
  const playlists = useStore(s => s.playlists)
  const addSongToPlaylist = useStore(s => s.addSongToPlaylist)
  const removeSongFromPlaylist = useStore(s => s.removeSongFromPlaylist)
  const removeSong = useStore(s => s.removeSong)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [onClose])

  // Keep menu inside viewport
  const menuW = 190, menuH = 200
  const left = Math.min(x, window.innerWidth - menuW - 8)
  const top  = Math.min(y, window.innerHeight - menuH - 8)

  return (
    <div ref={ref} className="ctx-menu" style={{ left, top }}>
      {playlists.length > 0 && (
        <>
          <div style={{ padding: '4px 12px 2px', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text3)' }}>
            Add to Playlist
          </div>
          {playlists.map(pl => (
            <div key={pl.id} className="ctx-item" onClick={() => { addSongToPlaylist(pl.id, songId); onClose() }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: pl.color, marginRight: 8 }} />
              {pl.name}
            </div>
          ))}
          <div className="ctx-divider" />
        </>
      )}

      {playlistId && (
        <div className="ctx-item" onClick={() => { removeSongFromPlaylist(playlistId, songId); onClose() }}>
          Remove from Playlist
        </div>
      )}

      <div className="ctx-item danger" onClick={() => { removeSong(songId); onClose() }}>
        Delete from Library
      </div>
    </div>
  )
}
