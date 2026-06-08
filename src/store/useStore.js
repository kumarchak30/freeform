import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../supabase'
import { saveFile, saveMeta, loadMeta, loadAllFiles, deleteFile, savePlaylists, loadPlaylists } from '../db'

function shuffleArr(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const cloudMode = () => !!supabase

const useStore = create((set, get) => ({
  // ── Library ────────────────────────────────────────────────────────────
  songs: [],
  hydrated: false,

  hydrate: async () => {
    if (cloudMode()) {
      try {
        const { fetchSongs, fetchPlaylists } = await import('../api')
        const [songs, playlists] = await Promise.all([fetchSongs(), fetchPlaylists()])
        set({ songs, playlists, hydrated: true })
      } catch (e) {
        console.error('Supabase fetch failed', e)
        set({ hydrated: true })
      }
    } else {
      const [meta, urlMap] = await Promise.all([
        Promise.resolve(loadMeta()),
        loadAllFiles(),
      ])
      const songs = meta.filter(s => urlMap[s.id]).map(s => ({ ...s, url: urlMap[s.id] }))
      const playlists = loadPlaylists()
      set({ songs, playlists, hydrated: true })
    }
  },

  addSongs: async (files) => {
    if (cloudMode()) {
      const { uploadSong } = await import('../api')
      const results = await Promise.allSettled(
        files.map(f => uploadSong(f, { name: f.name.replace(/\.[^/.]+$/, '') }))
      )
      const uploaded = results.filter(r => r.status === 'fulfilled').map(r => r.value)
      if (results.some(r => r.status === 'rejected'))
        console.error('Some uploads failed:', results.filter(r => r.status === 'rejected').map(r => r.reason))
      set(st => ({ songs: [...st.songs, ...uploaded] }))
    } else {
      const newSongs = files.map(file => ({
        id: uuidv4(), key: null,
        name: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist', album: 'Unknown Album',
        duration: 0, url: URL.createObjectURL(file), file,
      }))
      newSongs.forEach(s => saveFile(s.id, s.file))
      set(st => { const songs = [...st.songs, ...newSongs]; saveMeta(songs); return { songs } })
    }
  },

  updateSongMeta: (id, meta) =>
    set(st => ({ songs: st.songs.map(s => s.id === id ? { ...s, ...meta } : s) })),

  removeSong: async (id) => {
    const song = get().songs.find(s => s.id === id)
    if (cloudMode() && song?.key) {
      const { deleteSong } = await import('../api')
      await deleteSong(id, song.key).catch(console.error)
    } else {
      deleteFile(id)
    }
    set(st => {
      const songs = st.songs.filter(s => s.id !== id)
      const playlists = st.playlists.map(p => ({ ...p, songIds: p.songIds.filter(sid => sid !== id) }))
      if (!cloudMode()) { saveMeta(songs); savePlaylists(playlists) }
      return { songs, playlists }
    })
    // Sync playlist changes to Supabase
    if (cloudMode()) {
      const { updatePlaylistRemote } = await import('../api')
      get().playlists.forEach(p => updatePlaylistRemote(p.id, { songIds: p.songIds }).catch(console.error))
    }
  },

  // ── Playlists ──────────────────────────────────────────────────────────
  playlists: [],

  createPlaylist: async (name, color) => {
    if (cloudMode()) {
      const { createPlaylistRemote } = await import('../api')
      const pl = await createPlaylistRemote(name, color)
      set(st => ({ playlists: [...st.playlists, pl] }))
      return pl.id
    } else {
      const pl = { id: uuidv4(), name, color, songIds: [] }
      set(st => { const playlists = [...st.playlists, pl]; savePlaylists(playlists); return { playlists } })
      return pl.id
    }
  },

  renamePlaylist: async (id, name) => {
    set(st => ({ playlists: st.playlists.map(p => p.id === id ? { ...p, name } : p) }))
    if (cloudMode()) {
      const { updatePlaylistRemote } = await import('../api')
      await updatePlaylistRemote(id, { name }).catch(console.error)
    } else {
      savePlaylists(get().playlists)
    }
  },

  deletePlaylist: async (id) => {
    set(st => ({
      playlists: st.playlists.filter(p => p.id !== id),
      view: st.view === id ? 'library' : st.view,
    }))
    if (cloudMode()) {
      const { deletePlaylistRemote } = await import('../api')
      await deletePlaylistRemote(id).catch(console.error)
    } else {
      savePlaylists(get().playlists)
    }
  },

  addSongToPlaylist: async (playlistId, songId) => {
    set(st => ({
      playlists: st.playlists.map(p =>
        p.id === playlistId && !p.songIds.includes(songId)
          ? { ...p, songIds: [...p.songIds, songId] }
          : p
      )
    }))
    const pl = get().playlists.find(p => p.id === playlistId)
    if (cloudMode()) {
      const { updatePlaylistRemote } = await import('../api')
      await updatePlaylistRemote(playlistId, { songIds: pl.songIds }).catch(console.error)
    } else {
      savePlaylists(get().playlists)
    }
  },

  removeSongFromPlaylist: async (playlistId, songId) => {
    set(st => ({
      playlists: st.playlists.map(p =>
        p.id === playlistId ? { ...p, songIds: p.songIds.filter(id => id !== songId) } : p
      )
    }))
    const pl = get().playlists.find(p => p.id === playlistId)
    if (cloudMode()) {
      const { updatePlaylistRemote } = await import('../api')
      await updatePlaylistRemote(playlistId, { songIds: pl.songIds }).catch(console.error)
    } else {
      savePlaylists(get().playlists)
    }
  },

  reorderPlaylist: async (playlistId, from, to) => {
    set(st => ({
      playlists: st.playlists.map(p => {
        if (p.id !== playlistId) return p
        const ids = [...p.songIds]; const [m] = ids.splice(from, 1); ids.splice(to, 0, m)
        return { ...p, songIds: ids }
      })
    }))
    const pl = get().playlists.find(p => p.id === playlistId)
    if (cloudMode()) {
      const { updatePlaylistRemote } = await import('../api')
      await updatePlaylistRemote(playlistId, { songIds: pl.songIds }).catch(console.error)
    } else {
      savePlaylists(get().playlists)
    }
  },

  // ── Playback ───────────────────────────────────────────────────────────
  isPlaying: false, shuffleOn: false, loopMode: 'none',
  currentSongId: null, queue: [], queueIndex: 0,

  playSong: (songId, songIds) => {
    const pool = songIds ?? get().songs.map(s => s.id)
    const q = get().shuffleOn ? shuffleArr(pool) : [...pool]
    let idx = q.indexOf(songId)
    if (idx === -1) { q.unshift(songId); idx = 0 }
    set({ queue: q, queueIndex: idx, currentSongId: songId, isPlaying: true })
  },
  playPlaylist: (songIds) => {
    if (!songIds.length) return
    set({ shuffleOn: false, loopMode: 'none', queue: [...songIds], queueIndex: 0, currentSongId: songIds[0], isPlaying: true })
  },
  shufflePlaylist: (songIds) => {
    if (!songIds.length) return
    const q = shuffleArr(songIds)
    set({ shuffleOn: true, loopMode: 'none', queue: q, queueIndex: 0, currentSongId: q[0], isPlaying: true })
  },
  nextSong: () => {
    const { queue, queueIndex, loopMode, shuffleOn } = get()
    if (!queue.length) return
    const next = queueIndex + 1
    if (next >= queue.length) {
      if (loopMode === 'all') { const q = shuffleOn ? shuffleArr(queue) : queue; set({ queue: q, queueIndex: 0, currentSongId: q[0], isPlaying: true }) }
      else set({ isPlaying: false })
      return
    }
    set({ queueIndex: next, currentSongId: queue[next], isPlaying: true })
  },
  prevSong: () => {
    const { queue, queueIndex } = get()
    if (!queue.length) return
    const prev = Math.max(0, queueIndex - 1)
    set({ queueIndex: prev, currentSongId: queue[prev], isPlaying: true })
  },
  togglePlay:   () => set(s => ({ isPlaying: !s.isPlaying })),
  setIsPlaying: (v) => set({ isPlaying: v }),
  toggleShuffle: () => {
    const { shuffleOn, queue, queueIndex } = get()
    const cur = queue[queueIndex]
    if (!shuffleOn) { const q = [cur, ...shuffleArr(queue.filter((_, i) => i !== queueIndex))]; set({ shuffleOn: true, queue: q, queueIndex: 0 }) }
    else set({ shuffleOn: false })
  },
  cycleLoop: () => set(s => ({ loopMode: s.loopMode === 'none' ? 'all' : s.loopMode === 'all' ? 'one' : 'none' })),

  // ── Sort / View ────────────────────────────────────────────────────────
  sortKey: 'name', setSortKey: (k) => set({ sortKey: k }),
  view: 'library', setView: (v) => set({ view: v }),
}))

export default useStore
