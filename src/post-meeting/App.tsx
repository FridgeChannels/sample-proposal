import { useEffect, useState } from 'react'
import { applyQuoteToOrder, defaultOrder, FIXED_MAGNET_QUANTITY, PILOT_OFFER_DURATION_MS, readApiJson, snFromLocation, type PilotQuoteApiResponse } from './config'
import type { OrderState, ViewKey } from './types'
import { LiveDemoView } from './components/LiveDemoView'
import { SampleContentView } from './components/SampleContentView'
import { PilotPlanView } from './components/PilotPlanView'
import { FinanceView } from './components/FinanceView'
import { AddressView } from './components/AddressView'
import { GlobalUrgencyRail } from './components/GlobalUrgencyRail'
import './styles.css'

const viewFromHash = (): ViewKey => {
  const value = window.location.hash.replace('#', '')
  if (value === 'order') return 'plan'
  return value === 'plan' || value === 'content' || value === 'address' || value === 'finance' ? value : 'demo'
}

const STORAGE_KEY = 'fc-order-preview-v1'

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
    const migratedStatus = parsed.status === 'ready_for_approval' || parsed.status === 'approved' ? 'ready_for_checkout' : parsed.status
    return applyStatusPreview(ensureOfferWindow({
      ...defaultOrder,
      ...parsed,
      quantity: FIXED_MAGNET_QUANTITY,
      status: migratedStatus || defaultOrder.status,
      approval: undefined,
      package: packageSelection,
      timeline: defaultOrder.timeline,
    }))
  } catch {
    return applyStatusPreview(ensureOfferWindow(defaultOrder))
  }
}

export function App() {
  const financeToken = new URLSearchParams(window.location.search).get('finance')
  const magnetSn = snFromLocation()
  const [view, setView] = useState<ViewKey>(viewFromHash)
  const [demoMounted, setDemoMounted] = useState(view === 'demo')
  const [order, setOrder] = useState<OrderState>(loadOrder)
  const [now, setNow] = useState(Date.now)
  const [handoffError, setHandoffError] = useState('')
  const [handoffLoading, setHandoffLoading] = useState(Boolean(financeToken))
  const [quoteLoading, setQuoteLoading] = useState(Boolean(magnetSn && !financeToken))
  const [quoteError, setQuoteError] = useState('')
  const offerNow = previewOfferNow(order, now)
  const paymentComplete = order.status === 'paid' || order.financeHandoff?.status === 'paid'
  const showGlobalUrgency = !financeToken && !paymentComplete && order.pricing.loaded

  useEffect(() => {
    const syncView = () => setView(viewFromHash())
    window.addEventListener('hashchange', syncView)
    return () => window.removeEventListener('hashchange', syncView)
  }, [])

  useEffect(() => {
    if (view === 'demo') setDemoMounted(true)
  }, [view])

  useEffect(() => {
    if (financeToken) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
  }, [financeToken, order])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!magnetSn || financeToken) {
      setQuoteLoading(false)
      return
    }
    setQuoteLoading(true)
    setQuoteError('')
    fetch(`/api/pilot-quote?sn=${encodeURIComponent(magnetSn)}`)
      .then((response) => readApiJson<PilotQuoteApiResponse>(response, 'Unable to load pilot pricing.'))
      .then((payload) => {
        setOrder((current) => applyQuoteToOrder({ ...current, pricing: { ...current.pricing, loaded: false } }, payload))
      })
      .catch((error) => {
        setQuoteError(error instanceof Error ? error.message : 'Unable to load pilot pricing.')
      })
      .finally(() => setQuoteLoading(false))
  }, [financeToken, magnetSn])

  useEffect(() => {
    const token = financeToken
    if (!token) return
    fetch(`/api/finance-handoffs/${token}`)
      .then(async response => {
        const data = await readApiJson<{ order: OrderState; handoff: NonNullable<OrderState['financeHandoff']> }>(response, 'Unable to open finance link.')
        const handoffOrderStatus = data.handoff.status === 'paid' ? 'paid' : 'payment_pending'
        setOrder({ ...data.order, quantity: data.order.quantity || FIXED_MAGNET_QUANTITY, status: handoffOrderStatus, financeHandoff: data.handoff })
        openView('finance')
      })
      .catch(error => {
        setHandoffError(error.message)
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
          // Track handoff progress only; the quote already owns pricing and the
          // offer window, which the handoff payload does not carry.
          if (data?.handoff && data.handoff.status !== order.financeHandoff?.status) {
            setOrder((current) => ({
              ...current,
              financeHandoff: data.handoff,
              status: data.handoff.status === 'paid' ? 'paid' : current.status,
              paidAt: data.handoff.status === 'paid' ? current.paidAt || new Date().toISOString() : current.paidAt,
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

  const openLive = () => {
    if (financeToken) {
      const liveUrl = new URL(window.location.href)
      liveUrl.searchParams.delete('finance')
      liveUrl.hash = 'demo'
      window.location.assign(`${liveUrl.pathname}${liveUrl.search}${liveUrl.hash}`)
      return
    }
    openView('demo')
  }

  const blockingError = handoffError || quoteError
  const blockingLoading = handoffLoading || (quoteLoading && !financeToken)

  return (
    <div className={`post-meeting-app${view === 'demo' ? ' is-live-demo' : ''}${view === 'plan' ? ' has-plan-dock' : ''}${financeToken ? ' is-finance-handoff' : showGlobalUrgency ? ' has-global-urgency' : ''}`}>
      {blockingLoading && <main className="finance-empty" aria-label="Loading" />}
      {blockingError && <main className="finance-empty"><h1>Proposal unavailable.</h1><p>{blockingError}</p></main>}
      {!blockingLoading && !blockingError && <>
      {showGlobalUrgency && <GlobalUrgencyRail order={order} now={offerNow} onNavigate={openView} />}
      {demoMounted && !financeToken && <LiveDemoView active={view === 'demo'} onSeePlan={() => openView('plan')} />}
      {view === 'content' && !financeToken && <SampleContentView onBack={() => openView('plan')} />}
      {view === 'plan' && !financeToken && order.pricing.loaded && (
        <PilotPlanView
          order={order}
          magnetSn={magnetSn || order.pricing.magnetSn || ''}
          now={offerNow}
          onBack={() => window.history.back()}
          onOpenContent={() => openView('content')}
          onViewReceipt={() => openView('finance')}
          onChange={setOrder}
          onHandoffCreated={(financeHandoff, dbOrderId) => setOrder(current => ({ ...current, financeHandoff, dbOrderId, status: 'payment_pending' }))}
        />
      )}
      {view === 'address' && !paymentComplete && <AddressView order={order} onChange={setOrder} onBack={() => openView('plan')} />}
      {view === 'finance' && (
        <FinanceView
          order={order}
          magnetSn={magnetSn || order.pricing.magnetSn || ''}
          now={offerNow}
          onChange={setOrder}
          onBack={() => openView('plan')}
          onHome={openLive}
          externalHandoff={Boolean(financeToken) || paymentComplete}
        />
      )}
      </>}
    </div>
  )
}
