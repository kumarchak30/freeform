import { supabase, BUCKET } from './supabase'

// ── Songs table ────────────────────────────────────────────────────────────
export async function fetchSongs() {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data.map(row => ({
    ...row,
    url: getPublicUrl(row.key),
  }))
}

export async function uploadSong(file, meta = {}) {
  const ext  = file.name.split('.').pop()
  const base = (meta.name ?? file.name.replace(/\.[^/.]+$/, ''))
    .replace(/[^a-z0-9]/gi, '_').slice(0, 60)
  const key  = `${Date.now()}-${base}.${ext}`

  // 1. Upload file to Storage
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(key, file, { contentType: file.type || 'audio/mpeg', upsert: false })
  if (uploadErr) throw uploadErr

  // 2. Insert metadata row
  const row = {
    key,
    name:     meta.name     ?? file.name.replace(/\.[^/.]+$/, ''),
    artist:   meta.artist   ?? 'Unknown Artist',
    album:    meta.album    ?? 'Unknown Album',
    duration: meta.duration ?? 0,
  }
  const { data, error: dbErr } = await supabase.from('songs').insert(row).select().single()
  if (dbErr) {
    // Roll back storage upload if DB insert fails
    await supabase.storage.from(BUCKET).remove([key])
    throw dbErr
  }

  return { ...data, url: getPublicUrl(data.key) }
}

export async function updateSongMeta(id, meta) {
  const { error } = await supabase.from('songs').update(meta).eq('id', id)
  if (error) throw error
}

export async function deleteSong(id, key) {
  await supabase.storage.from(BUCKET).remove([key])
  const { error } = await supabase.from('songs').delete().eq('id', id)
  if (error) throw error
}

export function getPublicUrl(key) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key)
  return data.publicUrl
}

// ── Playlists table ────────────────────────────────────────────────────────
export async function fetchPlaylists() {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data.map(row => ({ ...row, songIds: row.song_ids ?? [] }))
}

export async function createPlaylistRemote(name, color) {
  const { data, error } = await supabase
    .from('playlists')
    .insert({ name, color, song_ids: [] })
    .select()
    .single()
  if (error) throw error
  return { ...data, songIds: [] }
}

export async function updatePlaylistRemote(id, fields) {
  // fields may contain songIds — map to song_ids for Supabase
  const { songIds, ...rest } = fields
  const patch = { ...rest }
  if (songIds !== undefined) patch.song_ids = songIds
  const { error } = await supabase.from('playlists').update(patch).eq('id', id)
  if (error) throw error
}

export async function deletePlaylistRemote(id) {
  const { error } = await supabase.from('playlists').delete().eq('id', id)
  if (error) throw error
}
