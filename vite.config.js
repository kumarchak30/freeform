import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// On GitHub Pages the site lives at /<repo-name>/
// Set VITE_BASE to your repo name, e.g. /freeform/
// In local dev it defaults to / which is correct.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
})
