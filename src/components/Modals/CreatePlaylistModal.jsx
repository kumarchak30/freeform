import { useState } from 'react'
import useStore from '../../store/useStore'

const COLORS = [
  '#7c6fff', '#bf5fff', '#3bf0e4', '#ff5fa0',
  '#ff9f43', '#48dbfb', '#1dd1a1', '#feca57',
  '#ff6b6b', '#a29bfe',
]

export default function CreatePlaylistModal({ onClose }) {
  const createPlaylist = useStore(s => s.createPlaylist)
  const setView = useStore(s => s.setView)

  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim() || loading) return
    setLoading(true)
    const id = await createPlaylist(name.trim(), color)
    setView(id)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">New Playlist</div>

        <label className="modal-label">Name</label>
        <input
          className="modal-input"
          placeholder="My Playlist"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          autoFocus
        />

        <label className="modal-label">Color</label>
        <div className="color-palette">
          {COLORS.map(c => (
            <div
              key={c}
              className={`color-swatch${color === c ? ' selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={!name.trim() || loading}>
            {loading ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
