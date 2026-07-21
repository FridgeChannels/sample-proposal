import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        reactGiftChallenge: resolve(projectRoot, 'gift-challenge-react.html'),
        postMeeting: resolve(projectRoot, 'post-meeting.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:4173',
      '/pics': 'http://127.0.0.1:4173',
      '/dashboard2': 'http://127.0.0.1:4173',
    },
  },
})
