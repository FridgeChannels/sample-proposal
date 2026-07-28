import { useState } from 'react'
import { createStripeCheckout, orderTotal, resolvedLineItems, statusLabels } from '../config'
import type { OrderState } from '../types'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const number = new Intl.NumberFormat('en-US')
const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

export function FinanceView({ order, now, onBack, externalHandoff = false }: { order: OrderState; now: number; onChange: (order: OrderState) => void; onBack: () => void; externalHandoff?: boolean }) {
  const [notice, setNotice] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const total = orderTotal(order, now)
  const locked = order.status === 'payment_pending' || order.status === 'paid'

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3600)
  }

  const payWithStripe = async () => {
    if (!order.dbOrderId) {
      showNotice('Missing order id — reopen the finance link from a placed order.')
      return
    }
    setCheckoutLoading(true)
    try {
      const session = await createStripeCheckout({
        orderId: order.dbOrderId,
        sn: order.pricing?.magnetSn,
        quantity: order.quantity,
        financeToken: order.financeHandoff?.token,
      })
      if (!session.url) throw new Error('Stripe did not return a checkout URL.')
      window.location.assign(session.url)
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Unable to start Stripe Checkout.')
      setCheckoutLoading(false)
    }
  }

  const copyPaymentLink = async () => {
    const link = order.financeHandoff?.paymentUrl || window.location.href
    try { await navigator.clipboard.writeText(link); showNotice('Payment link copied.') }
    catch { showNotice(link) }
  }

  if (!order.approval) return (
    <main className="finance-shell"><header className="finance-header"><div className="brand-mark"><span>FC</span><strong>FridgeChannel</strong></div></header><section className="finance-empty"><p className="eyebrow">ORDER NOT APPROVED</p><h1>This invoice is not ready yet.</h1><p>The business owner must approve the order before finance can review or pay it.</p><button className="primary-action" type="button" onClick={onBack}>Return to order <span>→</span></button></section></main>
  )

  if (order.status === 'expired' || order.status === 'cancelled') return (
    <main className="finance-shell"><header className="finance-header"><div className="brand-mark"><span>FC</span><strong>FridgeChannel</strong></div><div className="approval-state"><span />{statusLabels[order.status]}</div></header><section className="finance-empty"><p className="eyebrow">INVOICE {order.invoiceNumber}</p><h1>{order.status === 'expired' ? 'This payment link has expired.' : 'This order is no longer active.'}</h1><p>Please contact FC for a new secure link or the latest valid order version.</p><a className="primary-action" href="mailto:?subject=FC invoice support">Contact FC <span>↗</span></a></section></main>
  )

  return (
    <main className="finance-shell">
      <header className="finance-header"><div className="brand-mark"><span>FC</span><strong>FridgeChannel</strong></div><div className={`approval-state status-${order.status}`}><span />{statusLabels[order.status]}</div></header>
      <section className="invoice-hero"><div><p className="eyebrow">FC INVOICE</p><h1>Invoice #{order.invoiceNumber}</h1><p>{order.paymentTerms} · Order #{order.orderNumber} · Version {order.version}</p></div><div className="amount-due"><span>Amount due</span><strong>{money.format(total)}</strong><small>USD</small></div></section>

      {order.status === 'payment_pending' && <section className="payment-state-panel"><span>↗</span><div><strong>Payment Pending</strong><p>Complete Stripe Checkout to confirm this invoice. Status updates after payment webhook confirmation.</p></div></section>}
      {order.status === 'paid' && <section className="payment-state-panel paid-panel"><span>✓</span><div><strong>Payment Complete</strong><p>Paid {order.paidAt ? date.format(new Date(order.paidAt)) : ''} · {money.format(total)} · Stripe Checkout</p><small>Your project is ready to move into implementation.</small></div></section>}

      <div className="finance-layout">
        <div className="finance-main">
          <section className="finance-section customer-section">
            <div className="section-heading"><span>01</span><h2>Customer Information</h2></div>
            <div className="form-grid billing-form">
              <label><span>Billing contact</span><input disabled value={order.billing.contactName || order.approval.name} /></label>
              <label><span>Finance email</span><input disabled value={order.billing.email || order.financeHandoff?.email || order.approval.email} /></label>
              <label className="full-field"><span>Delivery address</span><textarea disabled rows={3} value={order.shippingAddress ? [order.shippingAddress.recipientName, order.shippingAddress.addressLine1, order.shippingAddress.addressLine2, `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`, order.shippingAddress.country].filter(Boolean).join('\n') : order.billing.address} /></label>
            </div>
          </section>

          <section className="finance-section summary-section">
            <div className="section-heading"><span>02</span><h2>Invoice Summary</h2></div>
            <div className="invoice-package"><div><span>Package</span><strong>{order.package.name}</strong></div><div><span>Quantity</span><strong>{number.format(order.quantity)} magnets</strong></div></div>
            <div className="line-items compact-line-items">
              {resolvedLineItems(order, now).map((item) => (
                <div key={item.id}>
                  <div><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</div>
                  <b className={item.kind === 'discount' ? 'discount' : ''}>{item.amount < 0 ? `−${money.format(Math.abs(item.amount))}` : money.format(item.amount)}</b>
                </div>
              ))}              <div><div><strong>Tax</strong><small>{order.pricing?.taxLabel || 'Not collected'}</small></div><b>Not collected</b></div>
              <div className="line-total"><div><strong>Amount due</strong></div><b>{money.format(total)}</b></div>
            </div>
          </section>

          <section className="finance-section approval-section">
            <div className="section-heading"><span>03</span><h2>Business Approval</h2></div>
            <div className="approval-record"><span className="approval-check">✓</span><div><strong>Approved by {order.approval.name}</strong><p>{order.approval.jobTitle || 'Business approver'} · {order.approval.email}</p><small>{date.format(new Date(order.approval.approvedAt))} · Version {order.approval.orderVersion}</small></div></div>
          </section>

          <section className="finance-section payment-section">
            <div className="section-heading"><span>04</span><h2>Payment</h2></div>
            <p className="backend-note" style={{ marginTop: 0 }}>Pay securely online with Stripe Checkout. Amounts are loaded from the saved order — not from the browser.</p>
            {!locked && (
              <button className="primary-action pay-invoice" type="button" disabled={checkoutLoading || !order.dbOrderId} onClick={payWithStripe}>
                {checkoutLoading ? 'Starting Checkout…' : 'Pay Securely Online'} <span>→</span>
              </button>
            )}
          </section>
        </div>

        <aside className="invoice-actions">
          <p className="eyebrow">INVOICE ACTIONS</p>
          <button type="button" className="primary-action" onClick={() => window.print()}>Download Invoice <span>↓</span></button>
          <button type="button" className="secondary-action" onClick={copyPaymentLink}>Copy Payment Link <span>↗</span></button>
          <a className="secondary-action" href={`mailto:?subject=${encodeURIComponent(`Question about invoice ${order.invoiceNumber}`)}`}>Contact FC <span>↗</span></a>
          {!externalHandoff && <button type="button" className="text-button" onClick={onBack}>Back to project order</button>}
          <div className="need-changes"><strong>Need changes to this invoice?</strong><p>Finance cannot change package, quantity, scope, unit price, or total. Contact FC to issue a new order version.</p></div>
        </aside>
      </div>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  )
}
