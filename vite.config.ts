import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))
const API_ORIGIN = 'http://127.0.0.1:4173'
const SAMPLE_PATH_RE = /^\/(?:gift-proposal|p)\/([^/?#]+)\/?/

/**
 * In Vite dev, rewrite /p/{sn} to sample or live HTML based on Supabase status
 * from the API server — same URL, no redirect (mirrors production server.js).
 */
async function resolveSamplePhaseHtml(pathname: string): Promise<string | null> {
  const match = SAMPLE_PATH_RE.exec(pathname)
  if (!match) return null

  const sn = decodeURIComponent(match[1])
  try {
    const response = await fetch(`${API_ORIGIN}/api/sample-phase?sn=${encodeURIComponent(sn)}`)
    if (!response.ok) return '/gift-challenge-react.html'
    const data = (await response.json()) as { phase?: string }
    return data.phase === 'live' ? '/post-meeting.html' : '/gift-challenge-react.html'
  } catch {
    // API server may not be up yet; default to sample deck.
    return '/gift-challenge-react.html'
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      // Homepage is the React gift-challenge page, matching server.js's `/` route
      name: 'serve-gift-challenge-as-index',
      configureServer(server) {
        server.middlewares.use(async (req, _res, next) => {
          if (!req.url) {
            next()
            return
          }

          const url = new URL(req.url, 'http://localhost')
          if (url.pathname === '/') {
            req.url = `/gift-challenge-react.html${url.search}`
            next()
            return
          }

          if (url.pathname === '/qualified-meeting-doc' || url.pathname === '/qualified-meeting-doc/') {
            req.url = `/qualified-meeting-doc.html${url.search}`
            next()
            return
          }

          if (url.pathname === '/fit-meeting-sample' || url.pathname === '/fit-meeting-sample/') {
            req.url = `/fit-meeting-sample.html${url.search}`
            next()
            return
          }

          if (url.pathname === '/pilot-plan' || url.pathname === '/pilot-plan/') {
            req.url = `/pilot-plan-prep.html${url.search}`
            next()
            return
          }

          if (url.pathname === '/pilot-plan/prep' || url.pathname === '/pilot-plan/prep/') {
            req.url = `/pilot-plan-prep.html${url.search}`
            next()
            return
          }

          if (url.pathname === '/pilot-plan/meet' || url.pathname === '/pilot-plan/meet/') {
            req.url = `/pilot-plan.html${url.search}`
            next()
            return
          }

          const rewritten = await resolveSamplePhaseHtml(url.pathname)
          if (rewritten) {
            // Keep path semantics for the client (sn still comes from the browser URL);
            // only the Vite internal file mapping changes.
            req.url = `${rewritten}${url.search}`
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
        qualifiedMeetingDoc: resolve(projectRoot, 'qualified-meeting-doc.html'),
        fitMeetingSample: resolve(projectRoot, 'fit-meeting-sample.html'),
        pilotPlan: resolve(projectRoot, 'pilot-plan.html'),
        pilotPlanPrep: resolve(projectRoot, 'pilot-plan-prep.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api': API_ORIGIN,
      '/pics': API_ORIGIN,
      '/assets': API_ORIGIN,
      '/data': API_ORIGIN,
      '/dashboard2': API_ORIGIN,
    },
  },
})
