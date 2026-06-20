const KEY = 'freeform_reform'
const MAX_HISTORY = 8 // keep up to 8 past weeks

function getMondayOf(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d.toISOString().split('T')[0]
}

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}

function save(store) {
  localStorage.setItem(KEY, JSON.stringify(store))
}

// store shape: { current: { weekOf, songPlays, playlistPlays }, history: [...] }
function getStore() {
  const week  = getMondayOf()
  const store = load()

  // First ever run
  if (!store) {
    const fresh = { weekOf: week, songPlays: {}, playlistPlays: {} }
    save({ current: fresh, history: [] })
    return { current: fresh, history: [] }
  }

  // Migrate old flat format (before history was added)
  if (!store.current) {
    const current = store.weekOf
      ? { weekOf: store.weekOf, songPlays: store.songPlays || {}, playlistPlays: store.playlistPlays || {} }
      : { weekOf: week, songPlays: {}, playlistPlays: {} }
    const migrated = { current, history: [] }
    save(migrated)
    return migrated
  }

  // New week — archive current, start fresh
  if (store.current.weekOf !== week) {
    const history = [store.current, ...store.history].slice(0, MAX_HISTORY)
    const fresh   = { weekOf: week, songPlays: {}, playlistPlays: {} }
    const updated = { current: fresh, history }
    save(updated)
    return updated
  }

  return store
}

export function recordPlay(songId, playlistId = 'library') {
  const store = getStore()
  store.current.songPlays[songId]         = (store.current.songPlays[songId]         || 0) + 1
  store.current.playlistPlays[playlistId] = (store.current.playlistPlays[playlistId] || 0) + 1
  save(store)
}

// ── Helpers that work on any week's data object ──────────────────────────────

function topSongsFrom(songs, weekData, limit = 10) {
  const { songPlays } = weekData
  return [...songs]
    .filter(s => songPlays[s.id])
    .sort((a, b) => (songPlays[b.id] || 0) - (songPlays[a.id] || 0))
    .slice(0, limit)
    .map(s => ({ ...s, playCount: songPlays[s.id] }))
}

function topPlaylistFrom(playlists, weekData) {
  const { playlistPlays } = weekData
  let top = null, max = 0
  for (const pl of playlists) {
    const count = playlistPlays[pl.id] || 0
    if (count > max) { max = count; top = pl }
  }
  return top && max > 0 ? { ...top, playCount: max } : null
}

function totalPlaysFrom(weekData) {
  return Object.values(weekData.songPlays).reduce((a, b) => a + b, 0)
}

function weekLabel(weekOf) {
  const d = new Date(weekOf + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Public API ───────────────────────────────────────────────────────────────

export function getTopSongs(songs, limit = 10) {
  return topSongsFrom(songs, getStore().current, limit)
}

export function getTopPlaylist(playlists) {
  return topPlaylistFrom(playlists, getStore().current)
}

export function getWeekLabel() {
  return weekLabel(getStore().current.weekOf)
}

export function getTotalPlays() {
  return totalPlaysFrom(getStore().current)
}

export function getPastWeeks(songs, playlists) {
  return getStore().history.map(week => ({
    weekOf:      week.weekOf,
    label:       weekLabel(week.weekOf),
    totalPlays:  totalPlaysFrom(week),
    topSongs:    topSongsFrom(songs, week, 10),
    topPlaylist: topPlaylistFrom(playlists, week),
  }))
}
