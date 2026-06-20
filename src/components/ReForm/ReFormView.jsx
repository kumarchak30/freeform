import { useMemo, useState } from 'react'
import useStore from '../../store/useStore'
import { getTopSongs, getTopPlaylist, getWeekLabel, getTotalPlays, getPastWeeks } from '../../reform'

function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`
}

function SongList({ songs, onPlay }) {
  return (
    <div className="reform-song-list">
      {songs.map((song, i) => (
        <div key={song.id} className="reform-song-row" onClick={() => onPlay(song.id, songs.map(s => s.id))}>
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
              style={{ width: `${(song.playCount / songs[0].playCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function PastWeekCard({ week, songs, playSong }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="reform-past-card">
      <div className="reform-past-card-header" onClick={() => setExpanded(v => !v)}>
        <div className="reform-past-card-left">
          <span className="reform-past-week-label">Week of {week.label}</span>
          <span className="reform-past-week-plays">{week.totalPlays} plays</span>
        </div>
        <div className="reform-past-card-right">
          {week.topPlaylist && (
            <span className="reform-past-top-playlist">
              <span className="reform-dot" style={{ background: week.topPlaylist.color }} />
              {week.topPlaylist.name}
            </span>
          )}
          <span className={`reform-past-chevron${expanded ? ' open' : ''}`}>
            <ChevronIcon />
          </span>
        </div>
      </div>

      {expanded && (
        <div className="reform-past-expanded">
          {week.topSongs.length === 0 ? (
            <p className="reform-past-empty">No songs tracked this week.</p>
          ) : (
            <>
              <div className="reform-section-header" style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Top Songs</span>
                <button className="reform-play-btn" onClick={() => playSong(week.topSongs[0].id, week.topSongs.map(s => s.id))}>
                  <PlayIcon /> Play all
                </button>
              </div>
              <SongList songs={week.topSongs} onPlay={playSong} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function ReFormView() {
  const songs     = useStore(s => s.songs)
  const playlists = useStore(s => s.playlists)
  const playSong  = useStore(s => s.playSong)
  const [showPast, setShowPast] = useState(false)

  const { topSongs, topPlaylist, weekLabel, totalPlays, pastWeeks } = useMemo(() => ({
    topSongs:    getTopSongs(songs, 10),
    topPlaylist: getTopPlaylist(playlists),
    weekLabel:   getWeekLabel(),
    totalPlays:  getTotalPlays(),
    pastWeeks:   getPastWeeks(songs, playlists),
  }), [songs, playlists])

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
                <button className="reform-play-btn" onClick={() => playSong(topSongs[0].id, topSongs.map(s => s.id))}>
                  <PlayIcon /> Play all
                </button>
              </div>
              <SongList songs={topSongs} onPlay={playSong} />
            </div>
          )}
        </>
      )}

      {/* Past Weeks */}
      {pastWeeks.length > 0 && (
        <div className="reform-past-section">
          <button className="reform-past-toggle" onClick={() => setShowPast(v => !v)}>
            <HistoryIcon />
            {showPast ? 'Hide past weeks' : `See past weeks (${pastWeeks.length})`}
            <span className={`reform-past-chevron${showPast ? ' open' : ''}`} style={{ marginLeft: 4 }}>
              <ChevronIcon />
            </span>
          </button>

          {showPast && (
            <div className="reform-past-list">
              {pastWeeks.map(week => (
                <PastWeekCard key={week.weekOf} week={week} songs={songs} playSong={playSong} />
              ))}
            </div>
          )}
        </div>
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
const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
  </svg>
)
const HistoryIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21a9 9 0 000-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
  </svg>
)
