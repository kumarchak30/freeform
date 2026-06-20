import { useMemo } from 'react'
import useStore from '../../store/useStore'
import { getTopPlaylist, getWeekLabel, getTotalPlays } from '../../reform'

export default function ReFormPanel() {
  const playlists = useStore(s => s.playlists)
  const setView   = useStore(s => s.setView)
  const view      = useStore(s => s.view)

  const { topPlaylist, weekLabel, totalPlays } = useMemo(() => ({
    topPlaylist: getTopPlaylist(playlists),
    weekLabel:   getWeekLabel(),
    totalPlays:  getTotalPlays(),
  }), [playlists, view]) // recompute when view changes (after navigating back)

  return (
    <div className="reform-panel" onClick={() => setView('reform')}>
      <div className="reform-panel-header">
        <ChartIcon />
        <span className="reform-panel-title">ReForm</span>
        <span className="reform-panel-week">Week of {weekLabel}</span>
      </div>

      {totalPlays === 0 ? (
        <div className="reform-panel-empty">Play some songs to see your stats</div>
      ) : (
        <div className="reform-panel-stats">
          {topPlaylist ? (
            <div className="reform-panel-row">
              <span className="reform-panel-label">Top Playlist</span>
              <span className="reform-panel-value">
                <span className="reform-dot" style={{ background: topPlaylist.color }} />
                {topPlaylist.name}
              </span>
            </div>
          ) : (
            <div className="reform-panel-row">
              <span className="reform-panel-label">Top Playlist</span>
              <span className="reform-panel-value" style={{ color: 'var(--text3)' }}>Library</span>
            </div>
          )}
          <div className="reform-panel-row">
            <span className="reform-panel-label">Plays this week</span>
            <span className="reform-panel-value">{totalPlays}</span>
          </div>
        </div>
      )}

      <div className="reform-panel-cta">View full stats →</div>
    </div>
  )
}

const ChartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z"/>
  </svg>
)
