import { useEffect, useRef, type ReactNode } from 'react'
import { POSTHOG_TOKEN, posthogOptions } from './options'
import { snFromLocation } from './sn'
import type { PostHog } from 'posthog-js'

export type ProposalAnalyticsPage = 'sample' | 'live'

type AnalyticsRootProps = {
  page: ProposalAnalyticsPage
  children: ReactNode
  /** Observe `main > section` dwell time (gift-challenge deck). */
  trackSectionDwell?: boolean
}

let posthogClient: PostHog | null = null
const pendingEvents: Array<[string, Record<string, unknown> | undefined]> = []

function flushPending(client: PostHog) {
  while (pendingEvents.length) {
    const [event, properties] = pendingEvents.shift()!
    client.capture(event, properties)
  }
}

function sectionKey(el: Element, index: number): string {
  if (el.id) return el.id
  const label = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')
  if (label) return label
  const className = typeof el.className === 'string' ? el.className.split(/\s+/).find(Boolean) : ''
  return className || `section_${index}`
}

function bindMagnetSession(client: PostHog, page: ProposalAnalyticsPage) {
  const sn = snFromLocation()
  client.register({
    proposal_page: page,
    magnet_sn: sn || 'unknown',
  })
  if (sn) {
    client.identify(sn, { magnet_sn: sn, proposal_page: page })
  }
  client.capture('proposal_opened', {
    proposal_page: page,
    magnet_sn: sn,
    path: window.location.pathname,
  })
}

function startSectionDwell(client: PostHog): () => void {
  const dwell = new Map<string, number>()
  const entered = new Map<Element, number>()
  let summarized = false

  const pauseOpenIntervals = () => {
    const now = performance.now()
    const sections = [...document.querySelectorAll('main > section')]
    entered.forEach((start, el) => {
      const key = sectionKey(el, sections.indexOf(el))
      dwell.set(key, (dwell.get(key) || 0) + Math.round(now - start))
    })
    entered.clear()
  }

  const observe = () => {
    const sections = [...document.querySelectorAll('main > section')]
    if (!sections.length) return null

    const observer = new IntersectionObserver(
      (entries) => {
        const now = performance.now()
        for (const entry of entries) {
          const key = sectionKey(entry.target, sections.indexOf(entry.target))
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            if (!entered.has(entry.target)) entered.set(entry.target, now)
          } else {
            const start = entered.get(entry.target)
            if (start == null) continue
            const ms = Math.round(now - start)
            entered.delete(entry.target)
            dwell.set(key, (dwell.get(key) || 0) + ms)
            if (ms >= 1000) {
              client.capture('section_dwell', {
                section: key,
                dwell_ms: ms,
                magnet_sn: snFromLocation(),
              })
            }
          }
        }
      },
      { threshold: [0, 0.35, 0.6] },
    )

    sections.forEach((section) => observer.observe(section))
    return observer
  }

  let observer = observe()
  const retry = window.setTimeout(() => {
    observer?.disconnect()
    observer = observe()
  }, 400)

  const summarize = () => {
    if (summarized) return
    pauseOpenIntervals()
    let longestSection = ''
    let longestMs = 0
    const sectionDwells: Record<string, number> = {}
    dwell.forEach((ms, key) => {
      sectionDwells[key] = ms
      if (ms > longestMs) {
        longestMs = ms
        longestSection = key
      }
    })
    if (!longestSection) return
    summarized = true
    client.capture('session_section_summary', {
      longest_section: longestSection,
      longest_dwell_ms: longestMs,
      section_dwells: sectionDwells,
      magnet_sn: snFromLocation(),
    })
  }

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') pauseOpenIntervals()
  }
  window.addEventListener('pagehide', summarize)
  document.addEventListener('visibilitychange', onVisibility)

  return () => {
    window.clearTimeout(retry)
    summarize()
    observer?.disconnect()
    window.removeEventListener('pagehide', summarize)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}

/**
 * Boots PostHog only when `VITE_POSTHOG_PROJECT_TOKEN` is set.
 * The SDK is dynamically imported so builds without a token stay lean.
 */
export function AnalyticsRoot({ page, children, trackSectionDwell = false }: AnalyticsRootProps) {
  const dwellStopRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const token = POSTHOG_TOKEN
    if (!token) return
    let cancelled = false

    void import('posthog-js').then(({ default: posthog }) => {
      if (cancelled) return
      if (!posthogClient) {
        posthog.init(token, posthogOptions)
        posthogClient = posthog
      }
      flushPending(posthog)
      bindMagnetSession(posthog, page)
      if (trackSectionDwell) {
        dwellStopRef.current?.()
        dwellStopRef.current = startSectionDwell(posthog)
      }
    })

    return () => {
      cancelled = true
      dwellStopRef.current?.()
      dwellStopRef.current = null
    }
  }, [page, trackSectionDwell])

  return <>{children}</>
}

/** Safe custom capture when PostHog may be uninitialized (no env token). */
export function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_TOKEN) return
  if (!posthogClient) {
    pendingEvents.push([event, properties])
    return
  }
  posthogClient.capture(event, properties)
}
