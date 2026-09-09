import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))
const require = createRequire(import.meta.url)
const pilotOpsAuth = require('./pilot-ops-auth.js') as {
  isPilotOpsLoginPath: (pathname: string) => boolean
  isPilotOpsProtectedPath: (pathname: string) => boolean
  isAuthenticated: (req: import('http').IncomingMessage) => boolean
  redirectToLogin: (res: import('http').ServerResponse, returnUrl?: string) => void
}
const API_ORIGIN = 'http://127.0.0.1:4173'
const SAMPLE_PATH_RE = /^\/(?:gift-proposal|p)\/([^/?#]+)\/?/

function loadPilotOpsEnv() {
  const envPath = resolve(projectRoot, '.env')
  if (!existsSync(envPath)) return
  readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const separator = trimmed.indexOf('=')
    if (separator === -1) return
    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
    if (key && process.env[key] === undefined) process.env[key] = value
  })
}

loadPilotOpsEnv()

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
      name: 'inject-post-meeting-public-config',
      transformIndexHtml(html, ctx) {
        if (!ctx.filename.endsWith('post-meeting.html')) return html
        const legalBase = String(process.env.VITE_LEGAL_DOCS_BASE_URL || '').replace(/\/$/, '')
        if (!legalBase) return html
        const injection = `<script>window.__FC_LEGAL_DOCS_BASE_URL__=${JSON.stringify(legalBase)};</script>`
        return html.replace('</head>', `${injection}</head>`)
      },
    },
    {
      // Homepage is the React gift-challenge page, matching server.js's `/` route
      name: 'serve-gift-challenge-as-index',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url) {
            next()
            return
          }

          const url = new URL(req.url, 'http://localhost')

          if (pilotOpsAuth.isPilotOpsLoginPath(url.pathname)) {
            if (pilotOpsAuth.isAuthenticated(req)) {
              const returnTo = url.searchParams.get('return') || '/pilot-plan/prep'
              const safeReturn = returnTo.startsWith('/') ? returnTo : '/pilot-plan/prep'
              res.statusCode = 302
              res.setHeader('Location', safeReturn)
              res.end()
              return
            }
            req.url = `/pilot-plan-login.html${url.search}`
            next()
            return
          }

          if (pilotOpsAuth.isPilotOpsProtectedPath(url.pathname) && !pilotOpsAuth.isAuthenticated(req)) {
            pilotOpsAuth.redirectToLogin(res, `${url.pathname}${url.search}`)
            return
          }

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

          if (url.pathname === '/fc-asin-plus-sample' || url.pathname === '/fc-asin-plus-sample/') {
            req.url = `/fc-asin-plus-sample.html${url.search}`
            next()
            return
          }

          if (url.pathname === '/christmas-asin-campaign' || url.pathname === '/christmas-asin-campaign/') {
            req.url = `/christmas-asin-campaign.html${url.search}`
            next()
            return
          }

          if (url.pathname === '/christmas-dtc-campaign' || url.pathname === '/christmas-dtc-campaign/') {
            req.url = `/christmas-dtc-campaign.html${url.search}`
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
        fcAsinPlusSample: resolve(projectRoot, 'fc-asin-plus-sample.html'),
        christmasAsinCampaign: resolve(projectRoot, 'christmas-asin-campaign.html'),
        christmasDtcCampaign: resolve(projectRoot, 'christmas-dtc-campaign.html'),
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
