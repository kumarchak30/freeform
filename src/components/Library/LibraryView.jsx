import useStore from '../../store/useStore'
import DropZone from './DropZone'
import SongTable from './SongTable'

export default function LibraryView() {
  const songs   = useStore(s => s.songs)
  const sortKey = useStore(s => s.sortKey)
  const setSortKey = useStore(s => s.setSortKey)

  const sorted = [...songs].sort((a, b) => a[sortKey]?.localeCompare(b[sortKey] ?? '') ?? 0)

  return (
    <div>
      <div className="view-header">
        <div>
          <div className="view-title">Library</div>
          <div className="view-subtitle">{songs.length} song{songs.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="sort-bar">
          <span style={{ color: 'var(--text3)', fontSize: 12, marginRight: 4 }}>Sort:</span>
          {['name', 'artist', 'album'].map(k => (
            <button
              key={k}
              className={`sort-btn${sortKey === k ? ' active' : ''}`}
              onClick={() => setSortKey(k)}
            >
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <DropZone />

      {sorted.length > 0
        ? <SongTable songs={sorted} />
        : (
          <div className="empty-state">
            <div className="empty-state-icon">🎧</div>
            <div className="empty-state-title">Your library is empty</div>
            <div>Drop some music above to get started</div>
          </div>
        )
      }
    </div>
  )
}
