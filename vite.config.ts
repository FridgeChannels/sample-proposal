import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    {
      // Homepage is the React gift-challenge page, matching server.js's `/` route
      name: 'serve-gift-challenge-as-index',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/') {
            req.url = '/gift-challenge-react.html'
          }
          next()
        })
      },
    },
  ],
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
