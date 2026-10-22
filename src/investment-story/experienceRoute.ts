import { snFromLocation } from '../analytics/sn'
export type InvestorChannel = 'dtc' | 'asin_plus'

export { snFromLocation }

export const LIVE_DEMO_ORIGIN = 'https://dealquest.fridgechannels.com'

const POSITION_KEY_PREFIX = 'fc-investor-story-position:'

export function channelFromSearch(search = window.location.search): InvestorChannel | null {
  const value = new URLSearchParams(search).get('experience')?.trim().toLowerCase()
  if (value === 'dtc') return 'dtc'
  if (value === 'asin_plus' || value === 'amazon') return 'asin_plus'
  return null
}

/** Same page URL with `?experience=` set (or removed), keeping other query params. */
export function storyUrlWithChannel(channel: InvestorChannel | null): string {
  const params = new URLSearchParams(window.location.search)
  if (channel) params.set('experience', channel)
  else params.delete('experience')
  const query = params.toString()
  return `${window.location.pathname}${query ? `?${query}` : ''}`
}

export type PosthogHandoff = { distinctId: string; sessionId: string } | null

export function experienceIframeSrc(sn: string, channel: InvestorChannel, visitId: string, handoff: PosthogHandoff): string {
  const params = new URLSearchParams({ experience: channel, fc_embed: 'investor', iv: visitId })
  if (handoff) {
    params.set('ph_did', handoff.distinctId)
    params.set('ph_sid', handoff.sessionId)
  }
  return `${LIVE_DEMO_ORIGIN}/p/${encodeURIComponent(sn)}?${params.toString()}`
}

type StoredPosition = { slideIndex: number; scrollY: number }

function positionKey() {
  return `${POSITION_KEY_PREFIX}${snFromLocation() || 'standalone'}`
}

export function saveStoryPosition(position: StoredPosition) {
  try {
    window.sessionStorage.setItem(positionKey(), JSON.stringify(position))
  } catch {
    // Storage can be unavailable (private mode); returning still works in-page.
  }
}

export function readStoryPosition(): StoredPosition | null {
  try {
    const raw = window.sessionStorage.getItem(positionKey())
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredPosition>
    if (typeof parsed.slideIndex !== 'number' || typeof parsed.scrollY !== 'number') return null
    return { slideIndex: parsed.slideIndex, scrollY: parsed.scrollY }
  } catch {
    return null
  }
}
