import { useEffect, useRef, useState } from 'react'
import { whenPosthogReady } from '../analytics'
import { POSTHOG_TOKEN } from '../analytics/options'
import {
  experienceIframeSrc,
  LIVE_DEMO_ORIGIN,
  type InvestorChannel,
  type PosthogHandoff,
} from './experienceRoute'
import { investorVisitId, trackInvestor } from './tracking'

/** Covers deferred idle boot, or eager kick + dynamic import of posthog-js. */
const HANDOFF_WAIT_MS = 4000

const channelLabels: Record<InvestorChannel, string> = {
  dtc: 'DTC Experience',
  asin_plus: 'Amazon Experience',
}

/** distinct_id + session_id so the framed FC app joins this replay and person. */
async function resolveHandoff(): Promise<PosthogHandoff> {
  if (!POSTHOG_TOKEN) return null
  const timeout = new Promise<null>((resolve) => window.setTimeout(() => resolve(null), HANDOFF_WAIT_MS))
  const client = await Promise.race([whenPosthogReady(), timeout])
  if (!client) return null
  return { distinctId: client.get_distinct_id(), sessionId: client.get_session_id() }
}

export type ExperienceCloseMethod = 'back_button' | 'browser_back'

export function ExperienceView({
  sn,
  channel,
  onBack,
}: {
  sn: string
  channel: InvestorChannel
  onBack: () => void
}) {
  const [src, setSrc] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const openedAtRef = useRef(performance.now())

  useEffect(() => {
    let cancelled = false
    void resolveHandoff().then((handoff) => {
      if (cancelled) return
      setSrc(experienceIframeSrc(sn, channel, investorVisitId(), handoff))
      trackInvestor('experience_iframe_requested', { channel, posthog_handoff: Boolean(handoff) })
    })
    return () => {
      cancelled = true
    }
  }, [sn, channel])

  useEffect(() => {
    let interactions = 0
    const onBlur = () => {
      // Focus moving into the cross-origin iframe is the only parent-side signal of a tap inside it.
      window.setTimeout(() => {
        if (document.activeElement !== iframeRef.current) return
        interactions += 1
        trackInvestor('experience_engaged', { channel, interaction_index: interactions, source: 'focus' })
      }, 0)
    }
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== LIVE_DEMO_ORIGIN || event.source !== iframeRef.current?.contentWindow) return
      const data = event.data as { type?: string; experience?: string; event?: string } | null
      if (data?.type === 'fc.embed.ready') {
        trackInvestor('experience_ready', {
          channel,
          resolved_experience: data.experience || null,
          ready_ms: Math.round(performance.now() - openedAtRef.current),
        })
      } else if (data?.type === 'fc.embed.interaction') {
        interactions += 1
        trackInvestor('experience_engaged', { channel, interaction_index: interactions, source: 'iframe', iframe_event: data.event || null })
      }
    }
    window.addEventListener('blur', onBlur)
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('message', onMessage)
    }
  }, [channel])

  const onLoad = () => {
    setLoaded(true)
    trackInvestor('experience_loaded', { channel, load_ms: Math.round(performance.now() - openedAtRef.current) })
  }

  return (
    <div className="story-experience" role="dialog" aria-modal="true" aria-label={channelLabels[channel]}>
      <div className="story-experience__stage">
        <div className="story-experience__device">
          <div className="story-experience__chrome">
            <div className="story-experience__status" aria-hidden="true">
              <span className="story-experience__status-time">9:41</span>
              <span className="story-experience__island" />
              <span className="story-experience__status-icons">
                <span className="story-experience__signal" />
                <span className="story-experience__wifi" />
                <span className="story-experience__battery" />
              </span>
            </div>
            <div className="story-experience__screen">
              {src && (
                <iframe
                  ref={iframeRef}
                  src={src}
                  title={`FridgeChannel ${channelLabels[channel]}`}
                  loading="eager"
                  allow="clipboard-read; clipboard-write; fullscreen"
                  allowFullScreen
                  onLoad={onLoad}
                />
              )}
              {!loaded && (
                <div className="story-experience__loading" aria-hidden="true">
                  <span />
                </div>
              )}
            </div>
            <div className="story-experience__home" aria-hidden="true" />
          </div>
        </div>
      </div>
      <button
        type="button"
        className="story-experience__back"
        data-track="experience_back"
        onClick={onBack}
        aria-label="Back to the investment story"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 6L9 12l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
