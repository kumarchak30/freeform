const DB_NAME = 'freeform'
const DB_VER  = 1
const STORE   = 'audio_files'
const META_KEY = 'freeform_song_meta'
const PL_KEY   = 'freeform_playlists'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER)
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE)
    req.onsuccess = e => resolve(e.target.result)
    req.onerror   = e => reject(e.target.error)
  })
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t  = db.transaction(STORE, mode)
    const st = t.objectStore(STORE)
    const req = fn(st)
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

export async function saveFile(id, file) {
  const db  = await openDB()
  const buf = await file.arrayBuffer()
  await tx(db, 'readwrite', st => st.put({ buf, type: file.type, name: file.name }, id))
}

export async function deleteFile(id) {
  const db = await openDB()
  await tx(db, 'readwrite', st => st.delete(id))
}

export async function loadAllFiles() {
  const db  = await openDB()
  const ids = await new Promise((res, rej) => {
    const t  = db.transaction(STORE, 'readonly')
    const req = t.objectStore(STORE).getAllKeys()
    req.onsuccess = () => res(req.result)
    req.onerror   = () => rej(req.error)
  })
  const entries = await Promise.all(ids.map(async id => {
    const rec = await tx(db, 'readonly', st => st.get(id))
    const blob = new Blob([rec.buf], { type: rec.type || 'audio/mpeg' })
    const url  = URL.createObjectURL(blob)
    return { id, url }
  }))
  return Object.fromEntries(entries.map(e => [e.id, e.url]))
}

// Song metadata (everything except url/file) → localStorage
export function saveMeta(songs) {
  const slim = songs.map(({ file, url, ...rest }) => rest)
  localStorage.setItem(META_KEY, JSON.stringify(slim))
}

export function loadMeta() {
  try { return JSON.parse(localStorage.getItem(META_KEY) ?? '[]') } catch { return [] }
}

// Playlists → localStorage
export function savePlaylists(playlists) {
  localStorage.setItem(PL_KEY, JSON.stringify(playlists))
}

export function loadPlaylists() {
  try { return JSON.parse(localStorage.getItem(PL_KEY) ?? '[]') } catch { return [] }
}
