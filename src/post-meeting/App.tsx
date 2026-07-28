import { useEffect, useState } from 'react'
import { applyPilotQuoteToOrder, defaultOrder, snFromLocation } from './config'
import type { OrderState, ViewKey } from './types'
import { TopNav } from './components/TopNav'
import { LiveDemoView } from './components/LiveDemoView'
import { SampleContentView } from './components/SampleContentView'
import { OrderView } from './components/OrderView'
import { FinanceView } from './components/FinanceView'
import { AddressView } from './components/AddressView'
import { PreviewCheckoutDock } from './components/PreviewCheckoutDock'
import { GlobalUrgencyRail } from './components/GlobalUrgencyRail'
import './styles.css'

const viewFromHash = (): ViewKey => {
  const value = window.location.hash.replace('#', '')
  return value === 'content' || value === 'order' || value === 'address' || value === 'finance' ? value : 'demo'
}

const STORAGE_KEY = 'fc-order-preview-v1'
const PILOT_OFFER_DURATION_MS = 8 * 24 * 60 * 60 * 1000

const ensureOfferWindow = (order: OrderState): OrderState => {
  const parsedStart = Date.parse(order.offerStartedAt)
  const startedAt = Number.isFinite(parsedStart) ? parsedStart : Date.now()
  const parsedExpiry = Date.parse(order.offerExpiresAt)
  const expiresAt = Number.isFinite(parsedExpiry) ? parsedExpiry : startedAt + PILOT_OFFER_DURATION_MS
  return { ...order, offerStartedAt: new Date(startedAt).toISOString(), offerExpiresAt: new Date(expiresAt).toISOString() }
}

const previewOfferNow = (order: OrderState, now: number) => {
  if (!import.meta.env.DEV) return now
  const preview = new URLSearchParams(window.location.search).get('offer-preview')
  const expiry = Date.parse(order.offerExpiresAt)
  if (!Number.isFinite(expiry)) return now
  if (preview === 'urgent') return expiry - 12 * 60 * 60 * 1000
  if (preview === 'expired') return expiry + 1000
  return now
}

const loadOrder = (): OrderState => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return ensureOfferWindow(defaultOrder)
    const parsed = JSON.parse(stored) as Partial<OrderState>
    const storedPackage = parsed.package
    const packageSelection = !storedPackage || storedPackage.name === 'Retention Moat'
      ? defaultOrder.package
      : { ...defaultOrder.package, ...storedPackage }
    return ensureOfferWindow({
      ...defaultOrder,
      ...parsed,
      package: packageSelection,
      timeline: defaultOrder.timeline,
      pricing: { ...defaultOrder.pricing, ...(parsed.pricing || {}) },
    })
  } catch {
    return ensureOfferWindow(defaultOrder)
  }
}

export function App() {
  const financeToken = new URLSearchParams(window.location.search).get('finance')
  const [view, setView] = useState<ViewKey>(viewFromHash)
  const [order, setOrder] = useState<OrderState>(loadOrder)
  const [now, setNow] = useState(Date.now)
  const [handoffError, setHandoffError] = useState('')
  const [handoffLoading, setHandoffLoading] = useState(Boolean(financeToken))
  const [quoteError, setQuoteError] = useState('')
  const offerNow = previewOfferNow(order, now)

  useEffect(() => {
    const syncView = () => setView(viewFromHash())
    window.addEventListener('hashchange', syncView)
    return () => window.removeEventListener('hashchange', syncView)
  }, [])

  useEffect(() => {
    if (financeToken) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
  }, [financeToken, order])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  // Load package / discount / min qty from Supabase via server (never trust client prices).
  useEffect(() => {
    if (financeToken) return
    const sn = snFromLocation()
    if (!sn) return

    let cancelled = false
    fetch(`/api/pilot-quote?sn=${encodeURIComponent(sn)}`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load pilot pricing.')
        if (cancelled) return
        setQuoteError('')
        setOrder((current) => applyPilotQuoteToOrder(current, data.quote))
      })
      .catch((error) => {
        if (!cancelled) setQuoteError(error.message || 'Unable to load pilot pricing.')
      })

    return () => {
      cancelled = true
    }
  }, [financeToken])

  useEffect(() => {
    const token = financeToken
    if (!token) return
    fetch(`/api/finance-handoffs/${token}`)
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to open finance link.')
        setOrder({
          ...defaultOrder,
          ...data.order,
          timeline: defaultOrder.timeline,
          pricing: { ...defaultOrder.pricing, ...(data.order?.pricing || {}) },
        })
        openView('finance')
        return undefined
      })
      .catch(error => setHandoffError(error.message))
      .finally(() => setHandoffLoading(false))
  }, [financeToken])

  useEffect(() => {
    const token = order.financeHandoff?.token
    if (!token || view === 'finance') return
    const poll = window.setInterval(() => fetch(`/api/finance-handoffs/${token}`).then(response => response.ok ? response.json() : null).then(data => {
      if (!data?.handoff) return
      if (data.handoff.status === order.financeHandoff?.status && !data.order?.dbOrderId) return
      setOrder(current => ({
        ...current,
        ...(data.order || {}),
        timeline: current.timeline,
        financeHandoff: {
          ...data.handoff,
          paymentUrl: data.handoff.paymentUrl || current.financeHandoff?.paymentUrl || '',
        },
        status: data.handoff.status === 'paid' ? 'paid' : data.handoff.status === 'payment_pending' ? 'payment_pending' : current.status,
        dbOrderId: data.order?.dbOrderId ?? current.dbOrderId,
      }))
    }).catch(() => undefined), 5000)
    return () => window.clearInterval(poll)
  }, [order.financeHandoff?.token, order.financeHandoff?.status, view])

  const openView = (nextView: ViewKey) => {
    window.location.hash = nextView
    setView(nextView)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const showUrgency = !financeToken && pilotOfferPhaseHasDiscount(order)

  return (
    <div className={`post-meeting-app${view === 'demo' || view === 'content' ? ' has-preview-dock' : ''}${view === 'order' ? ' has-order-dock' : ''}${financeToken ? ' is-finance-handoff' : showUrgency ? ' has-global-urgency' : ''}`}>
      {handoffLoading && <main className="finance-empty"><p className="eyebrow">SECURE FINANCE LINK</p><h1>Loading approved order…</h1></main>}
      {handoffError && <main className="finance-empty"><h1>Finance link unavailable.</h1><p>{handoffError}</p></main>}
      {!handoffLoading && !handoffError && <>
      {showUrgency && <GlobalUrgencyRail order={order} now={offerNow} onNavigate={openView} />}
      {!financeToken && <TopNav active={view} onChange={openView} />}
      {quoteError && <div className="toast" role="status">{quoteError}</div>}
      {view === 'demo' && <LiveDemoView />}
      {view === 'content' && <SampleContentView />}
      {view === 'order' && <OrderView order={order} now={offerNow} onChange={setOrder} onOpenAddress={() => openView('address')} onOpenFinance={() => openView('finance')} />}
      {view === 'address' && <AddressView order={order} onChange={setOrder} onBack={() => openView('order')} />}
      {view === 'finance' && <FinanceView order={order} now={offerNow} onChange={setOrder} onBack={() => openView('order')} externalHandoff={Boolean(financeToken)} />}
      {(view === 'demo' || view === 'content') && <PreviewCheckoutDock order={order} now={offerNow} onPlaceOrder={() => openView('order')} />}
      </>}
    </div>
  )
}

function pilotOfferPhaseHasDiscount(order: OrderState) {
  if (order.pricing?.loaded && !order.pricing.discountActive) return false
  if (order.pricing?.loaded && order.pricing.discountPercentOff <= 0) return false
  return true
}
