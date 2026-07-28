import { useEffect, useState } from 'react'
import { defaultOrder } from './config'
import type { OrderState, ViewKey } from './types'
import { TopNav } from './components/TopNav'
import { LiveDemoView } from './components/LiveDemoView'
import { SampleContentView } from './components/SampleContentView'
import { OrderView } from './components/OrderView'
import { FinanceView } from './components/FinanceView'
import { AddressView } from './components/AddressView'
import { GlobalUrgencyRail } from './components/GlobalUrgencyRail'
import { LoginView } from './components/LoginView'
import './styles.css'

const viewFromHash = (): ViewKey => {
  const value = window.location.hash.replace('#', '')
  return value === 'content' || value === 'order' || value === 'address' || value === 'finance' || value === 'login' ? value : 'demo'
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

const applyStatusPreview = (order: OrderState): OrderState => {
  if (!import.meta.env.DEV) return order
  const previewStatus = new URLSearchParams(window.location.search).get('status-preview')
  if (previewStatus !== 'ready_for_checkout' && previewStatus !== 'sent_to_finance' && previewStatus !== 'payment_pending' && previewStatus !== 'paid') return order
  const status = previewStatus as OrderState['status']
  const financeHandoff: OrderState['financeHandoff'] = order.financeHandoff && (status === 'payment_pending' || status === 'paid')
    ? { ...order.financeHandoff, status: status === 'paid' ? 'paid' : 'payment_pending' }
    : order.financeHandoff
  return { ...order, status, paidAt: status === 'paid' ? order.paidAt || new Date().toISOString() : undefined, financeHandoff }
}

const loadOrder = (): OrderState => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return applyStatusPreview(ensureOfferWindow(defaultOrder))
    const parsed = JSON.parse(stored) as Partial<OrderState>
    const storedPackage = parsed.package
    const packageSelection = !storedPackage || storedPackage.name === 'Retention Moat'
      ? defaultOrder.package
      : { ...defaultOrder.package, ...storedPackage }
    const legacyViewer = parsed.viewer || (parsed.approval ? {
      name: parsed.approval.name,
      email: parsed.approval.email,
      provider: 'email' as const,
      signedInAt: parsed.approval.approvedAt,
    } : undefined)
    const migratedStatus = parsed.status === 'ready_for_approval' || parsed.status === 'approved' ? 'ready_for_checkout' : parsed.status
    return applyStatusPreview(ensureOfferWindow({ ...defaultOrder, ...parsed, status: migratedStatus || defaultOrder.status, viewer: legacyViewer, approval: undefined, package: packageSelection, timeline: defaultOrder.timeline }))
  } catch {
    return applyStatusPreview(ensureOfferWindow(defaultOrder))
  }
}

export function App() {
  const financeToken = new URLSearchParams(window.location.search).get('finance')
  const [view, setView] = useState<ViewKey>(viewFromHash)
  const [order, setOrder] = useState<OrderState>(loadOrder)
  const [now, setNow] = useState(Date.now)
  const [handoffError, setHandoffError] = useState('')
  const [handoffLoading, setHandoffLoading] = useState(Boolean(financeToken))
  const offerNow = previewOfferNow(order, now)
  const paymentComplete = order.status === 'paid' || order.financeHandoff?.status === 'paid'
  const showGlobalUrgency = !financeToken && !paymentComplete && view !== 'login'

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

  useEffect(() => {
    const token = financeToken
    if (!token) return
    fetch(`/api/finance-handoffs/${token}`)
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to open finance link.')
        const handoffOrderStatus = data.handoff.status === 'paid' ? 'paid' : 'payment_pending'
        setOrder({ ...data.order, status: handoffOrderStatus, financeHandoff: data.handoff })
        openView('finance')
      })
      .catch(error => {
        setHandoffError(error.message)
        // Drop stale handoff from local draft so the 5s poll does not keep 404ing.
        setOrder((current) => {
          if (current.financeHandoff?.token !== token) return current
          const { financeHandoff: _removed, ...rest } = current
          return { ...rest, financeHandoff: undefined }
        })
      })
      .finally(() => setHandoffLoading(false))
  }, [financeToken])

  useEffect(() => {
    const token = order.financeHandoff?.token
    if (!token || view === 'finance' || financeToken) return
    let failed = false
    const poll = window.setInterval(() => {
      if (failed) return
      fetch(`/api/finance-handoffs/${token}`)
        .then(async (response) => {
          if (response.status === 404 || response.status === 410) {
            failed = true
            setOrder((current) => {
              if (current.financeHandoff?.token !== token) return current
              return { ...current, financeHandoff: undefined }
            })
            return null
          }
          return response.ok ? response.json() : null
        })
        .then((data) => {
          if (data?.handoff && data.handoff.status !== order.financeHandoff?.status) {
            setOrder((current) => ({
              ...current,
              financeHandoff: data.handoff,
              status: data.handoff.status === 'paid' ? 'paid' : current.status,
            }))
          }
        })
        .catch(() => undefined)
    }, 5000)
    return () => window.clearInterval(poll)
  }, [order.financeHandoff?.token, order.financeHandoff?.status, view, financeToken])

  const openView = (nextView: ViewKey) => {
    window.location.hash = nextView
    setView(nextView)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const completeSignIn = (viewer: NonNullable<OrderState['viewer']>) => {
    setOrder(current => ({ ...current, viewer, approval: undefined, status: current.status === 'draft' || current.status === 'ready_for_approval' || current.status === 'approved' ? 'ready_for_checkout' : current.status }))
    openView('order')
  }

  return (
    <div className={`post-meeting-app${view === 'order' ? ' has-order-dock' : ''}${financeToken ? ' is-finance-handoff' : showGlobalUrgency ? ' has-global-urgency' : ''}`}>
      {handoffLoading && <main className="finance-empty"><p className="eyebrow">SECURE FINANCE LINK</p><h1>Loading payment request…</h1></main>}
      {handoffError && <main className="finance-empty"><h1>Finance link unavailable.</h1><p>{handoffError}</p></main>}
      {!handoffLoading && !handoffError && <>
      {showGlobalUrgency && <GlobalUrgencyRail order={order} now={offerNow} onNavigate={openView} />}
      {!financeToken && view !== 'login' && <TopNav active={view} onChange={openView} />}
      {view === 'demo' && <LiveDemoView />}
      {view === 'content' && <SampleContentView />}
      {view === 'order' && <OrderView order={order} now={offerNow} onChange={setOrder} onOpenAddress={() => openView('address')} onOpenFinance={() => openView('finance')} onOpenLogin={() => openView('login')} />}
      {view === 'address' && <AddressView order={order} onChange={setOrder} onBack={() => openView('order')} />}
      {view === 'finance' && <FinanceView order={order} now={offerNow} onBack={() => openView('order')} externalHandoff={Boolean(financeToken)} />}
      {view === 'login' && <LoginView onSuccess={completeSignIn} onBack={() => openView('demo')} />}
      </>}
    </div>
  )
}
