import { useState } from 'react'
import useStore from '../../store/useStore'
import SongTable from './SongTable'

export default function PlaylistView({ playlistId }) {
  const songs          = useStore(s => s.songs)
  const playlists      = useStore(s => s.playlists)
  const deletePlaylist = useStore(s => s.deletePlaylist)
  const renamePlaylist = useStore(s => s.renamePlaylist)
  const setView        = useStore(s => s.setView)
  const playPlaylist   = useStore(s => s.playPlaylist)
  const shufflePlaylist = useStore(s => s.shufflePlaylist)

  const playlist = playlists.find(p => p.id === playlistId)

  const [editing, setEditing] = useState(false)
  const [nameVal, setNameVal] = useState('')

  if (!playlist) return null

  const plSongs  = playlist.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean)
  const songPool = plSongs.map(s => s.id)

  const startEdit  = () => { setNameVal(playlist.name); setEditing(true) }
  const commitEdit = () => { if (nameVal.trim()) renamePlaylist(playlist.id, nameVal.trim()); setEditing(false) }

  const handleDelete = () => { deletePlaylist(playlist.id); setView('library') }

  return (
    <div>
      {/* Banner */}
      <div
        className="playlist-banner"
        style={{
          background: `linear-gradient(135deg, ${playlist.color}22, ${playlist.color}44)`,
          border: `1px solid ${playlist.color}33`,
        }}
      >
        <div className="playlist-banner-bg" style={{ background: playlist.color }} />
        <div className="playlist-banner-content" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              {editing ? (
                <input
                  className="modal-input"
                  style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", background: 'rgba(255,255,255,0.1)', marginBottom: 0, width: 300 }}
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false) }}
                  autoFocus
                />
              ) : (
                <div className="playlist-banner-name" onDoubleClick={startEdit} title="Double-click to rename">
                  {playlist.name}
                </div>
              )}
              <div className="playlist-banner-count">
                {plSongs.length} song{plSongs.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Play / Shuffle / manage buttons */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <button
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px' }}
                disabled={plSongs.length === 0}
                onClick={() => playPlaylist(songPool)}
              >
                <PlayBtnIcon /> Play
              </button>
              <button
                className="btn btn-ghost"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px' }}
                disabled={plSongs.length === 0}
                onClick={() => shufflePlaylist(songPool)}
              >
                <ShuffleBtnIcon /> Shuffle
              </button>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '8px 14px' }} onClick={startEdit}>
                Rename
              </button>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '8px 14px', color: 'var(--pink)' }} onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {plSongs.length > 0
        ? <SongTable songs={plSongs} songPool={songPool} playlistId={playlist.id} draggable />
        : (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ fontSize: 36 }}>🎵</div>
            <div className="empty-state-title">No songs yet</div>
            <div>Right-click any song in your library and add it here</div>
          </div>
        )
      }
    </div>
  )
}

const PlayBtnIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
const ShuffleBtnIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
