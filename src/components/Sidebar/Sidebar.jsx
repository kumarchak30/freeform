import useStore from '../../store/useStore'
import ReFormPanel from '../ReForm/ReFormPanel'

export default function Sidebar({ open, onClose, onCreatePlaylist }) {
  const playlists = useStore(s => s.playlists)
  const view      = useStore(s => s.view)
  const setView   = useStore(s => s.setView)

  const navigate = (id) => { setView(id); onClose() }

  return (
    <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
      {/* Logo + close button */}
      <div className="sidebar-logo">
        <div className="logo-mark">FF</div>
        <span className="logo-name">Freeform</span>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <CloseIcon />
        </button>
      </div>

      <div className="sidebar-section-label">Library</div>
      <nav className="sidebar-nav">
        <div
          className={`sidebar-nav-item${view === 'library' ? ' active' : ''}`}
          onClick={() => navigate('library')}
        >
          <LibraryIcon />
          All Songs
        </div>
      </nav>

      <div className="sidebar-section-label" style={{ marginTop: 8 }}>Playlists</div>
      <div className="sidebar-playlists">
        {playlists.length === 0 && (
          <div style={{ padding: '6px 12px', color: 'var(--text3)', fontSize: 12 }}>
            No playlists yet
          </div>
        )}
        {playlists.map(pl => (
          <div
            key={pl.id}
            className={`playlist-item${view === pl.id ? ' active' : ''}`}
            onClick={() => navigate(pl.id)}
          >
            <div className="playlist-dot" style={{ background: pl.color }} />
            <span className="playlist-item-name">{pl.name}</span>
          </div>
        ))}
      </div>

      <button className="sidebar-create-btn" onClick={onCreatePlaylist}>
        <PlusIcon />
        New Playlist
      </button>

      <div className="sidebar-reform-wrap">
        <ReFormPanel />
      </div>
    </aside>
  )
}

const LibraryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
  </svg>
)
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
)
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
)
