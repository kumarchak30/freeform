/**
 * Freeform API Worker
 *
 * Routes:
 *   GET  /api/songs           → list all songs (public)
 *   POST /api/songs           → upload song    (requires Bearer token)
 *   DELETE /api/songs/:key    → delete song    (requires Bearer token)
 *   GET  /audio/:key          → stream audio   (public, range-aware)
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

function err(msg, status = 400) {
  return json({ error: msg }, status)
}

function authorized(request, env) {
  const token = env.UPLOAD_TOKEN
  if (!token) return true // no token set → open (dev only)
  const auth = request.headers.get('Authorization') ?? ''
  return auth === `Bearer ${token}`
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const { pathname } = url

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS })
    }

    // ── GET /api/songs ─────────────────────────────────────────────────
    if (pathname === '/api/songs' && request.method === 'GET') {
      const listed = await env.MUSIC.list()
      const songs = listed.objects.map(obj => {
        const m = obj.customMetadata ?? {}
        return {
          id:       obj.key,
          key:      obj.key,
          name:     m.name     ?? obj.key,
          artist:   m.artist   ?? 'Unknown Artist',
          album:    m.album    ?? 'Unknown Album',
          duration: parseFloat(m.duration ?? '0'),
          size:     obj.size,
          audioUrl: `/audio/${encodeURIComponent(obj.key)}`,
        }
      })
      return json(songs)
    }

    // ── POST /api/songs ────────────────────────────────────────────────
    if (pathname === '/api/songs' && request.method === 'POST') {
      if (!authorized(request, env)) return err('Unauthorized', 401)

      const form = await request.formData()
      const file = form.get('file')
      if (!file) return err('No file provided')

      const meta = {
        name:     form.get('name')     ?? file.name.replace(/\.[^/.]+$/, ''),
        artist:   form.get('artist')   ?? 'Unknown Artist',
        album:    form.get('album')    ?? 'Unknown Album',
        duration: form.get('duration') ?? '0',
      }

      // Use a unique key: timestamp + sanitized filename
      const ext = file.name.split('.').pop()
      const key = `${Date.now()}-${meta.name.replace(/[^a-z0-9]/gi, '_').slice(0, 60)}.${ext}`

      await env.MUSIC.put(key, file.stream(), {
        httpMetadata:   { contentType: file.type || 'audio/mpeg' },
        customMetadata: meta,
      })

      return json({
        id:       key,
        key,
        audioUrl: `/audio/${encodeURIComponent(key)}`,
        ...meta,
        duration: parseFloat(meta.duration),
      }, 201)
    }

    // ── DELETE /api/songs/:key ─────────────────────────────────────────
    if (pathname.startsWith('/api/songs/') && request.method === 'DELETE') {
      if (!authorized(request, env)) return err('Unauthorized', 401)
      const key = decodeURIComponent(pathname.replace('/api/songs/', ''))
      await env.MUSIC.delete(key)
      return json({ deleted: key })
    }

    // ── GET /audio/:key  (range-aware streaming) ───────────────────────
    if (pathname.startsWith('/audio/')) {
      const key = decodeURIComponent(pathname.replace('/audio/', ''))
      const rangeHeader = request.headers.get('Range')

      let r2Opts = {}
      let status = 200

      if (rangeHeader) {
        // Parse "bytes=start-end"
        const match = rangeHeader.match(/bytes=(\d*)-(\d*)/)
        if (match) {
          const start = match[1] ? parseInt(match[1]) : undefined
          const end   = match[2] ? parseInt(match[2]) : undefined
          r2Opts = { range: { offset: start, length: end != null && start != null ? end - start + 1 : undefined } }
          status = 206
        }
      }

      const obj = await env.MUSIC.get(key, r2Opts)
      if (!obj) return new Response('Not found', { status: 404, headers: CORS })

      const headers = {
        ...CORS,
        'Content-Type':  obj.httpMetadata?.contentType ?? 'audio/mpeg',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      }

      if (obj.size) headers['Content-Length'] = String(obj.size)

      if (status === 206 && rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d*)-(\d*)/)
        if (match && obj.size) {
          const start = match[1] ? parseInt(match[1]) : 0
          const end   = match[2] ? parseInt(match[2]) : obj.size - 1
          headers['Content-Range'] = `bytes ${start}-${end}/${obj.size}`
        }
      }

      return new Response(obj.body, { status, headers })
    }

    return new Response('Not found', { status: 404, headers: CORS })
  },
}
