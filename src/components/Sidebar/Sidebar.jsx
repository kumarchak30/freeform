import useStore from '../../store/useStore'

export default function Sidebar({ onCreatePlaylist }) {
  const playlists = useStore(s => s.playlists)
  const view = useStore(s => s.view)
  const setView = useStore(s => s.setView)

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">FF</div>
        <span className="logo-name">Freeform</span>
      </div>

      {/* Nav */}
      <div className="sidebar-section-label">Library</div>
      <nav className="sidebar-nav">
        <div
          className={`sidebar-nav-item${view === 'library' ? ' active' : ''}`}
          onClick={() => setView('library')}
        >
          <LibraryIcon />
          All Songs
        </div>
      </nav>

      {/* Playlists */}
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
            onClick={() => setView(pl.id)}
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
