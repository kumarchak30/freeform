import { useMemo } from 'react'
import useStore from '../../store/useStore'
import { getTopSongs, getTopPlaylist, getWeekLabel, getTotalPlays } from '../../reform'

function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`
}

export default function ReFormView() {
  const songs     = useStore(s => s.songs)
  const playlists = useStore(s => s.playlists)
  const playSong  = useStore(s => s.playSong)

  const { topSongs, topPlaylist, weekLabel, totalPlays } = useMemo(() => ({
    topSongs:    getTopSongs(songs, 10),
    topPlaylist: getTopPlaylist(playlists),
    weekLabel:   getWeekLabel(),
    totalPlays:  getTotalPlays(),
  }), [songs, playlists])

  const playTopSongs = () => {
    if (!topSongs.length) return
    playSong(topSongs[0].id, topSongs.map(s => s.id))
  }

  return (
    <div className="reform-view">
      {/* Header */}
      <div className="reform-view-header">
        <div className="reform-view-title-row">
          <ChartIcon />
          <h1 className="reform-view-title">ReForm</h1>
        </div>
        <p className="reform-view-subtitle">Your listening stats · Week of {weekLabel}</p>
      </div>

      {totalPlays === 0 ? (
        <div className="reform-empty">
          <p>Nothing tracked yet this week.</p>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>
            Songs are counted after 10 seconds of playback.
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="reform-cards">
            <div className="reform-card">
              <div className="reform-card-value">{totalPlays}</div>
              <div className="reform-card-label">Plays this week</div>
            </div>
            <div className="reform-card">
              <div className="reform-card-value">{topSongs.length}</div>
              <div className="reform-card-label">Songs played</div>
            </div>
            {topPlaylist && (
              <div className="reform-card reform-card-playlist">
                <div className="reform-card-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="reform-dot-lg" style={{ background: topPlaylist.color }} />
                  <span style={{ fontSize: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {topPlaylist.name}
                  </span>
                </div>
                <div className="reform-card-label">Top playlist · {topPlaylist.playCount} plays</div>
              </div>
            )}
          </div>

          {/* Top Songs */}
          {topSongs.length > 0 && (
            <div className="reform-section">
              <div className="reform-section-header">
                <h2 className="reform-section-title">Your Top Songs</h2>
                <button className="reform-play-btn" onClick={playTopSongs}>
                  <PlayIcon /> Play all
                </button>
              </div>

              <div className="reform-song-list">
                {topSongs.map((song, i) => (
                  <div
                    key={song.id}
                    className="reform-song-row"
                    onClick={() => playSong(song.id, topSongs.map(s => s.id))}
                  >
                    <span className="reform-song-rank">{i + 1}</span>
                    <div className="reform-song-art">♪</div>
                    <div className="reform-song-info">
                      <div className="reform-song-name">{song.name}</div>
                      <div className="reform-song-artist">{song.artist}</div>
                    </div>
                    <div className="reform-song-meta">
                      <span className="reform-song-plays">{song.playCount} plays</span>
                      <span className="reform-song-duration">{fmt(song.duration)}</span>
                    </div>
                    <div className="reform-song-bar-wrap">
                      <div
                        className="reform-song-bar"
                        style={{ width: `${(song.playCount / topSongs[0].playCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const ChartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent)' }}>
    <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z"/>
  </svg>
)
const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
)
