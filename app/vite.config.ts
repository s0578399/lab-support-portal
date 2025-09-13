import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Erlaube Zugriff auf das Repo-Root (eine Ebene über app/)
      allow: [path.resolve(__dirname, '..')],
    },
  },
})
