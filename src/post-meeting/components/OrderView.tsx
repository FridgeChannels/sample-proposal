import { useEffect, useRef, useState } from 'react'
import { orderTotal, resolvedLineItems } from '../config'
import type { FinanceContact, FinanceHandoff, OrderState } from '../types'
import { SendFinanceModal } from './SendFinanceModal'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const number = new Intl.NumberFormat('en-US')

export function OrderView({ order, now, onChange, onOpenAddress, onOpenFinance, onOpenLogin }: { order: OrderState; now: number; onChange: (order: OrderState) => void; onOpenAddress: () => void; onOpenFinance: () => void; onOpenLogin: () => void }) {
  const [showFinance, setShowFinance] = useState(false)
  const [servicesExpanded, setServicesExpanded] = useState(false)
  const [timelineExpanded, setTimelineExpanded] = useState(false)
  const [notice, setNotice] = useState('')
  const [addressRequired, setAddressRequired] = useState(false)
  const addressEntryRef = useRef<HTMLButtonElement>(null)
  const total = orderTotal(order, now)
  const isSignedIn = !!order.viewer
  const isPaymentComplete = order.status === 'paid' || order.financeHandoff?.status === 'paid'
  const isLocked = ['sent_to_finance', 'payment_pending', 'paid'].includes(order.status)
  const shippingAddressText = [order.shippingAddress.addressLine1, order.shippingAddress.addressLine2, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode].filter(Boolean).join(', ')
  const hasShippingAddress = Boolean(order.shippingAddress.recipientName && order.shippingAddress.addressLine1 && order.shippingAddress.city && order.shippingAddress.state && order.shippingAddress.postalCode)
  const servicePreview = order.package.includedServices.map((group) => group.items[0]).filter(Boolean).slice(0, 4)

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3600)
  }

  const requireShippingAddress = () => {
    if (hasShippingAddress) return true
    setAddressRequired(true)
    window.requestAnimationFrame(() => {
      addressEntryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      addressEntryRef.current?.focus({ preventScroll: true })
    })
    return false
  }

  const openAddress = () => {
    setAddressRequired(false)
    onOpenAddress()
  }

  useEffect(() => {
    if (!timelineExpanded && !servicesExpanded) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTimelineExpanded(false)
        setServicesExpanded(false)
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [timelineExpanded, servicesExpanded])

  useEffect(() => {
    if (hasShippingAddress) setAddressRequired(false)
  }, [hasShippingAddress])

  const openFinanceHandoff = () => {
    if (!isSignedIn) return onOpenLogin()
    if (!requireShippingAddress()) return
    setShowFinance(true)
  }

  const openPayment = () => {
    if (!isSignedIn) return onOpenLogin()
    if (!requireShippingAddress()) return
    onChange({ ...order, billing: { ...order.billing, companyName: order.billing.companyName || order.shippingAddress.companyName, contactName: order.billing.contactName || order.viewer?.name || '', email: order.billing.email || order.viewer?.email || '', address: order.billing.address || shippingAddressText }, status: 'payment_pending', paidAt: undefined })
    onOpenFinance()
  }

  const copyPaymentLink = async () => {
    const link = order.financeHandoff?.paymentUrl || `${window.location.origin}${window.location.pathname}#finance`
    try { await navigator.clipboard.writeText(link); showNotice('Payment link copied.') }
    catch { showNotice(link) }
  }

  const sendToFinance = async (contact: FinanceContact): Promise<FinanceHandoff> => {
    const response = await fetch('/api/finance-handoffs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order, total, email: contact.email, name: contact.name, message: contact.message, ccEmail: contact.ccCurrentContact ? order.viewer?.email : '', baseUrl: window.location.origin }) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Unable to send finance handoff.')
    onChange({ ...order, financeContact: contact, financeHandoff: data.handoff, billing: { ...order.billing, email: contact.email }, status: 'payment_pending', sentAt: data.handoff.sentAt })
    return data.handoff
  }

  return (
    <main className="view-shell order-view">
      <div className="order-layout full-order-layout">
        <div className="order-main">
          <section className="order-block product-order-block">
            <button ref={addressEntryRef} className={`address-entry ${hasShippingAddress ? 'has-address' : ''} ${addressRequired ? 'is-invalid' : ''}`} type="button" onClick={openAddress} aria-invalid={addressRequired || undefined}>
              <span className="address-entry-copy"><small className="order-section-title">Delivery address</small><strong>{hasShippingAddress ? order.shippingAddress.recipientName : 'Add delivery address'}</strong>{hasShippingAddress && <span>{`${shippingAddressText}, ${order.shippingAddress.country}`}</span>}</span>{!hasShippingAddress && <b aria-hidden="true">+</b>}
            </button>
            <div className="package-selection-label"><span className="order-section-title">Package</span><strong>{order.package.name}</strong></div>
            <div className="product-order-grid">
              <figure className="product-thumbnail"><img src="/pics/DIsplayProcessPics/front_back.png" alt="Double-sided branded NFC fridge magnet sample" /></figure>
              <div className="product-order-copy">
                <h2>Double-sided branded NFC fridge magnet</h2>
                <p className="product-unit-price"><span>{money.format(order.unitPrice)}</span> per magnet / year</p>
                <div className="product-services-preview">
                  <button className="product-services-link" type="button" onClick={() => setServicesExpanded(true)} aria-expanded={servicesExpanded} aria-controls="included-services-sheet"><span>Included Services</span><b className="row-chevron" aria-hidden="true">›</b></button>
                  <ul>{servicePreview.map((service) => <li key={service}><span aria-hidden="true">✓</span>{service}</li>)}</ul>
                </div>
                <div className="quantity-order-row">
                  <label><span>Magnet quantity</span>{isPaymentComplete ? <div className="quantity-locked-display" aria-label={`${number.format(order.quantity)} pieces`}><strong>{number.format(order.quantity)}</strong><span>pieces</span></div> : <div className="quantity-control"><button type="button" disabled={isLocked || order.quantity <= 1000} onClick={() => onChange({ ...order, quantity: Math.max(1000, order.quantity - 100) })} aria-label="Decrease quantity">−</button><input type="number" min="1000" step="100" disabled={isLocked} value={order.quantity} onChange={(event) => onChange({ ...order, quantity: Math.max(1000, Number(event.target.value) || 1000) })} /><button type="button" disabled={isLocked} onClick={() => onChange({ ...order, quantity: order.quantity + 100 })} aria-label="Increase quantity">+</button></div>}{!isPaymentComplete && <small>Minimum 1,000 magnets</small>}</label>
                </div>
              </div>
            </div>
            <section className="price-breakdown" aria-labelledby="price-breakdown-title">
              <h3 className="order-section-title" id="price-breakdown-title">Price details</h3>
              <div className="line-items" role="table" aria-label="Order amount breakdown">
                {resolvedLineItems(order, now).map((item) => <div role="row" key={item.id}><div role="cell"><strong>{item.kind === 'discount' ? <>Pilot discount · <span className="discount-rate">20% OFF</span></> : item.label}</strong>{item.id !== 'magnets' && item.detail && <small>{item.detail}</small>}</div><b role="cell" className={item.kind === 'discount' ? 'discount' : ''}>{item.amount < 0 ? `−${money.format(Math.abs(item.amount))}` : money.format(item.amount)}</b></div>)}
                <div role="row"><div role="cell"><strong>Tax</strong></div><b role="cell">{money.format(order.tax)}</b></div>
                <div className="line-total" role="row"><div role="cell"><strong className="order-section-title">Total</strong></div><b role="cell">{money.format(total)}</b></div>
              </div>
            </section>
            {isSignedIn && <div className="signed-in-identity"><div><small>SIGNED IN</small><strong>{order.viewer?.name}</strong><span>{order.viewer?.email}</span></div><button type="button" onClick={onOpenLogin}>Change</button></div>}
            {order.financeHandoff && <div className={`finance-handoff-status is-${order.financeHandoff.status}`}><div><small>FINANCE HANDOFF</small><strong>{order.financeHandoff.status === 'paid' ? 'Payment complete' : 'Payment pending'}</strong><span>{order.financeHandoff.email}</span></div><div><button type="button" onClick={copyPaymentLink}>Copy link</button><button type="button" onClick={() => setShowFinance(true)}>Edit</button></div></div>}
          </section>

          <section className="after-order-info collaboration-timeline">
            <button className="timeline-section-toggle" type="button" onClick={() => setTimelineExpanded(true)} aria-expanded={timelineExpanded} aria-controls="collaboration-timeline-sheet"><span><strong>Timeline</strong></span><b className="row-chevron" aria-hidden="true">›</b></button>
          </section>

        </div>

      </div>

      <div className={`checkout-dock ${isSignedIn ? 'is-placed' : ''}`} role="region" aria-label="Order checkout">
        {!isSignedIn && <div className="dock-total"><span>{number.format(order.quantity)} magnets</span><strong>{money.format(total)}</strong><small>Estimated total</small></div>}
        <div className="dock-actions">
          {!isSignedIn && <button className="primary-action" type="button" onClick={() => { if (requireShippingAddress()) onOpenLogin() }}>Place order <span>→</span></button>}
          {isSignedIn && (order.status === 'draft' || order.status === 'ready_for_approval' || order.status === 'approved' || order.status === 'ready_for_checkout') && <><button className="primary-action" type="button" onClick={openFinanceHandoff}>Send to Finance <span>→</span></button><button className="secondary-action" type="button" onClick={openPayment}>Pay Now <span>→</span></button></>}
          {(order.status === 'sent_to_finance' || order.status === 'payment_pending') && <><button className="primary-action" type="button" onClick={onOpenFinance}>Place order <span>→</span></button><button className="secondary-action" type="button" onClick={() => setShowFinance(true)}>Finance Contact <span>→</span></button></>}
          {order.status === 'paid' && <div className="dock-complete"><span>✓</span><strong>Payment Complete</strong></div>}
        </div>
      </div>

      {timelineExpanded && <div className="timeline-sheet-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) setTimelineExpanded(false) }}>
        <section className="timeline-sheet" id="collaboration-timeline-sheet" role="dialog" aria-modal="true" aria-labelledby="timeline-sheet-title">
          <header><strong id="timeline-sheet-title">Timeline</strong><button type="button" onClick={() => setTimelineExpanded(false)} aria-label="Close timeline">×</button></header>
          <div className="collaboration-phases">{order.timeline.map((phase, index) => <div className="collaboration-phase-wrap" key={phase.title}><details className="collaboration-phase"><summary><span className="phase-index">{String(index + 1).padStart(2, '0')}</span><span className="phase-summary"><small>{phase.duration}</small><strong>{phase.title}</strong></span><span className="phase-toggle" aria-hidden="true">+</span></summary>{phase.detail && <div className="phase-detail"><p>{phase.detail}</p></div>}</details><div className="phase-transition"><span className={`phase-arrow${index === order.timeline.length - 1 ? ' is-placeholder' : ''}`} aria-hidden="true">↓</span><span className="phase-output"><small>Output</small>{phase.output}</span></div></div>)}</div>
        </section>
      </div>}

      {servicesExpanded && <div className="timeline-sheet-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) setServicesExpanded(false) }}>
        <section className="timeline-sheet services-sheet" id="included-services-sheet" role="dialog" aria-modal="true" aria-labelledby="services-sheet-title">
          <header><strong id="services-sheet-title">Included Services</strong><button type="button" onClick={() => setServicesExpanded(false)} aria-label="Close included services">×</button></header>
          <div className="package-service-groups">{order.package.includedServices.map((group) => <section className="package-service-group" key={group.title}><strong>{group.title}</strong><ul className="scope-grid">{group.items.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul></section>)}</div>
        </section>
      </div>}

      {showFinance && <SendFinanceModal initial={order.financeContact} onClose={() => setShowFinance(false)} onSend={sendToFinance} />}
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  )
}
