import { useState, useRef } from 'react'
import useStore from '../../store/useStore'

const ACCEPTED = 'audio/*,.mp3,.m4a,.wav,.flac,.ogg'

export default function DropZone() {
  const addSongs  = useStore(s => s.addSongs)
  const cloudMode = useStore(s => s.cloudMode)
  const [over, setOver]         = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]  = useState('')
  const inputRef = useRef(null)

  const handleFiles = async (files) => {
    const audio = Array.from(files).filter(f =>
      f.type.startsWith('audio/') || /\.(mp3|m4a|wav|flac|ogg)$/i.test(f.name)
    )
    if (!audio.length) return

    if (cloudMode) {
      setUploading(true)
      setProgress(`Uploading ${audio.length} file${audio.length > 1 ? 's' : ''}…`)
    }

    try {
      await addSongs(audio)
      if (cloudMode) setProgress(`Done! ${audio.length} song${audio.length > 1 ? 's' : ''} added.`)
    } catch (e) {
      if (cloudMode) setProgress('Upload failed — check console.')
      console.error(e)
    } finally {
      if (cloudMode) {
        setTimeout(() => { setUploading(false); setProgress('') }, 2500)
      }
    }
  }

  const onDrop = (e) => {
    e.preventDefault(); setOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div
      className={`drop-zone${over ? ' over' : ''}`}
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      style={{ cursor: uploading ? 'default' : 'pointer' }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />

      {uploading ? (
        <>
          <div className="drop-zone-icon" style={{ animation: 'spin 1s linear infinite' }}>⟳</div>
          <div className="drop-zone-title">{progress}</div>
          <div className="drop-zone-sub">Uploading to Cloudflare R2…</div>
        </>
      ) : (
        <>
          <div className="drop-zone-icon">🎵</div>
          <div className="drop-zone-title">
            {cloudMode ? 'Drop music to upload to the cloud' : 'Drop your music here'}
          </div>
          <div className="drop-zone-sub">
            {cloudMode
              ? 'MP3, M4A, WAV, FLAC, OGG · Stored in R2 · Available to everyone'
              : 'MP3, M4A, WAV, FLAC, OGG · Click to browse · Stored locally'}
          </div>
        </>
      )}
    </div>
  )
}
