import { useEffect, useState } from 'react'
import { defaultOrder } from './config'
import type { OrderState, ViewKey } from './types'
import { TopNav } from './components/TopNav'
import { LiveDemoView } from './components/LiveDemoView'
import { SampleContentView } from './components/SampleContentView'
import { OrderView } from './components/OrderView'
import { FinanceView } from './components/FinanceView'
import { AddressView } from './components/AddressView'
import { PreviewCheckoutDock } from './components/PreviewCheckoutDock'
import './styles.css'

const viewFromHash = (): ViewKey => {
  const value = window.location.hash.replace('#', '')
  return value === 'content' || value === 'order' || value === 'address' || value === 'finance' ? value : 'demo'
}

const STORAGE_KEY = 'fc-order-preview-v1'

const loadOrder = (): OrderState => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? { ...defaultOrder, ...JSON.parse(stored) } : defaultOrder
  } catch {
    return defaultOrder
  }
}

export function App() {
  const [view, setView] = useState<ViewKey>(viewFromHash)
  const [order, setOrder] = useState<OrderState>(loadOrder)

  useEffect(() => {
    const syncView = () => setView(viewFromHash())
    window.addEventListener('hashchange', syncView)
    return () => window.removeEventListener('hashchange', syncView)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
  }, [order])

  const openView = (nextView: ViewKey) => {
    window.location.hash = nextView
    setView(nextView)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="post-meeting-app">
      {view !== 'finance' && view !== 'address' && <TopNav active={view} orderStatus={order.status} onChange={openView} />}
      {view === 'demo' && <LiveDemoView />}
      {view === 'content' && <SampleContentView />}
      {view === 'order' && <OrderView order={order} onChange={setOrder} onOpenAddress={() => openView('address')} onOpenFinance={() => openView('finance')} />}
      {view === 'address' && <AddressView order={order} onChange={setOrder} onBack={() => openView('order')} />}
      {view === 'finance' && <FinanceView order={order} onChange={setOrder} onBack={() => openView('order')} />}
      {(view === 'demo' || view === 'content') && <PreviewCheckoutDock order={order} onPlaceOrder={() => openView('order')} />}
    </div>
  )
}
