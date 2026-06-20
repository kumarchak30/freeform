import { useState } from 'react'
import useStore from './store/useStore'
import useAudio from './hooks/useAudio'
import useWakeLock from './hooks/useWakeLock'
import useMediaSession from './hooks/useMediaSession'
import Sidebar from './components/Sidebar/Sidebar'
import LibraryView from './components/Library/LibraryView'
import PlaylistView from './components/Library/PlaylistView'
import ReFormView from './components/ReForm/ReFormView'
import Player from './components/Player/Player'
import CreatePlaylistModal from './components/Modals/CreatePlaylistModal'

export default function App() {
  const view = useStore(s => s.view)
  const { audioRef, analyserRef } = useAudio()
  useWakeLock()
  useMediaSession(audioRef)
  const [showCreate, setShowCreate] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 769)

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className={`app${sidebarOpen ? ' sidebar-open' : ''}`}>
      {/* Overlay on mobile only — tap outside sidebar to close */}
      {sidebarOpen && window.innerWidth < 769 && <div className="sidebar-overlay" onClick={closeSidebar} />}

      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        onCreatePlaylist={() => { setShowCreate(true); closeSidebar() }}
      />

      <main className="main">
        {/* Top bar with hamburger */}
        <div className="topbar">
          <button className="hamburger" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
          <span className="topbar-title">
            {view === 'library' ? 'Library' : view === 'reform' ? 'ReForm' : null}
          </span>
        </div>

        {view === 'library'
          ? <LibraryView />
          : view === 'reform'
          ? <ReFormView />
          : <PlaylistView playlistId={view} />
        }
      </main>

      <div className="player-bar">
        <Player audioRef={audioRef} analyserRef={analyserRef} />
      </div>

      {showCreate && <CreatePlaylistModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
