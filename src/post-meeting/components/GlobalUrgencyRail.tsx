import { useEffect, useMemo, useState } from 'react'
import { pilotOfferPhase, pilotOfferRemainingMs, resolvedLineItems } from '../config'
import type { OrderState, ViewKey } from '../types'

type RailState = 'active' | 'urgent' | 'critical' | 'expired' | 'paid'

const savings = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const countdownParts = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
  return [
    { value: Math.floor(totalSeconds / 86400), short: 'd', label: 'Days' },
    { value: Math.floor((totalSeconds % 86400) / 3600), short: 'h', label: 'Hours' },
    { value: Math.floor((totalSeconds % 3600) / 60), short: 'm', label: 'Minutes' },
    { value: totalSeconds % 60, short: 's', label: 'Seconds' },
  ]
}

const resolveRailState = (order: OrderState, now: number): RailState => {
  const handoffStatus = order.financeHandoff?.status
  // Only a confirmed finance handoff payment is evidence that funds were received.
  // The local order status can be set by the in-app payment preview before that
  // confirmation arrives, so it must not replace the discount countdown here.
  if (handoffStatus === 'paid') return 'paid'
  const offerPhase = pilotOfferPhase(order, now)
  if (offerPhase === 'expired') return 'expired'
  const remaining = pilotOfferRemainingMs(order, now)
  if (remaining <= 6 * 60 * 60 * 1000) return 'critical'
  if (offerPhase === 'urgent') return 'urgent'
  return 'active'
}

const copy: Record<RailState, { label: string; title: string; detail: string; action: string; destination: ViewKey }> = {
  active: { label: '8-day pilot offer', title: 'Pilot pricing', detail: 'Pilot pricing ends automatically.', action: 'See pilot plan', destination: 'plan' },
  urgent: { label: 'Final 24 hours', title: 'Offer ends today', detail: 'Secure the pilot price before zero.', action: 'See pilot plan', destination: 'plan' },
  critical: { label: 'Ending soon', title: 'Last chance', detail: 'Standard pricing returns at zero.', action: 'See pilot plan', destination: 'plan' },
  expired: { label: 'Offer ended', title: 'Standard pricing restored', detail: 'Contact FC if you need a revised offer.', action: 'See pilot plan', destination: 'plan' },
  paid: { label: 'Payment complete', title: 'Pilot ready to start', detail: 'The order is ready for implementation.', action: 'View receipt', destination: 'finance' },
}

export function GlobalUrgencyRail({ order, now, onNavigate }: { order: OrderState; now: number; onNavigate: (view: ViewKey) => void }) {
  const [expanded, setExpanded] = useState(true)
  const state = resolveRailState(order, now)
  const showCountdown = state === 'active' || state === 'urgent' || state === 'critical'
  const discountAmount = resolvedLineItems(order, now).find((item) => item.kind === 'discount')?.amount
  const baseContent = copy[state]
  const content = showCountdown && discountAmount && order.pricing.discountActive
    ? { ...baseContent, title: `Save ${savings.format(Math.abs(discountAmount))}` }
    : baseContent
  const parts = useMemo(() => countdownParts(pilotOfferRemainingMs(order, now)), [order, now])

  useEffect(() => {
    const timer = window.setTimeout(() => setExpanded(false), 1200)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <aside className={`global-urgency-rail is-${state}${expanded ? ' is-entry-expanded' : ''}`} aria-label={`${content.label}: ${content.title}`}>
      <button type="button" onClick={() => onNavigate(content.destination)}>
        <span className="urgency-kicker"><i aria-hidden="true" /><small>{content.label}</small></span>
        <span className="urgency-message"><strong>{content.title}</strong><small>{content.detail}</small></span>
        {showCountdown && <time className="global-countdown" dateTime={order.offerExpiresAt} aria-label="Offer time remaining">
          {parts.map((part) => <span key={part.label}><b>{String(part.value).padStart(2, '0')}</b><small className="countdown-long-label">{part.label}</small><small className="countdown-short-label">{part.short}</small></span>)}
        </time>}
        <span className="urgency-action">{content.action}<b aria-hidden="true">→</b></span>
      </button>
    </aside>
  )
}
