const KEY = 'freeform_reform'

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

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

function getOrInit() {
  const week = getMondayOf()
  const data = load()
  if (!data || data.weekOf !== week) {
    const fresh = { weekOf: week, songPlays: {}, playlistPlays: {} }
    save(fresh)
    return fresh
  }
  return data
}

export function recordPlay(songId, playlistId = 'library') {
  const data = getOrInit()
  data.songPlays[songId]         = (data.songPlays[songId]         || 0) + 1
  data.playlistPlays[playlistId] = (data.playlistPlays[playlistId] || 0) + 1
  save(data)
}

export function getTopSongs(songs, limit = 10) {
  const { songPlays } = getOrInit()
  return [...songs]
    .filter(s => songPlays[s.id])
    .sort((a, b) => (songPlays[b.id] || 0) - (songPlays[a.id] || 0))
    .slice(0, limit)
    .map(s => ({ ...s, playCount: songPlays[s.id] }))
}

export function getTopPlaylist(playlists) {
  const { playlistPlays } = getOrInit()
  let top = null, max = 0
  for (const pl of playlists) {
    const count = playlistPlays[pl.id] || 0
    if (count > max) { max = count; top = pl }
  }
  return top && max > 0 ? { ...top, playCount: max } : null
}

export function getWeekLabel() {
  const { weekOf } = getOrInit()
  const d = new Date(weekOf + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getTotalPlays() {
  const { songPlays } = getOrInit()
  return Object.values(songPlays).reduce((a, b) => a + b, 0)
}
