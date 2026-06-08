import { useState } from 'react'
import useStore from './store/useStore'
import useAudio from './hooks/useAudio'
import Sidebar from './components/Sidebar/Sidebar'
import LibraryView from './components/Library/LibraryView'
import PlaylistView from './components/Library/PlaylistView'
import Player from './components/Player/Player'
import CreatePlaylistModal from './components/Modals/CreatePlaylistModal'

export default function App() {
  const view = useStore(s => s.view)
  const { audioRef, analyserRef } = useAudio()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="app">
      <Sidebar onCreatePlaylist={() => setShowCreate(true)} />

      <main className="main">
        {view === 'library'
          ? <LibraryView />
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
