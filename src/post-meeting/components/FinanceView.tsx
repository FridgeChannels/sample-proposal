import { useState } from 'react'
import { orderTotal, resolvedLineItems } from '../config'
import type { OrderState, PaymentMethod } from '../types'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const number = new Intl.NumberFormat('en-US')
const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

const paymentMethodLabels: Record<PaymentMethod, string> = {
  ach: 'ACH bank transfer',
  bank_transfer: 'Bank transfer',
  card: 'Credit card',
}

export function FinanceView({ order, now, onBack, externalHandoff = false }: { order: OrderState; now: number; onBack: () => void; externalHandoff?: boolean }) {
  const total = orderTotal(order, now)
  const isPaid = order.status === 'paid' || order.financeHandoff?.status === 'paid'
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order.paymentMethod)
  const [checkoutRequested, setCheckoutRequested] = useState(false)

  if (!isPaid) return (
    <main className="finance-shell payment-shell">
      <header className="finance-header"><div className="brand-mark"><span>FC</span><strong>FridgeChannel</strong></div></header>
      <section className="invoice-hero">
        <div><p className="eyebrow">PAYMENT</p><h1>Choose a payment method</h1><p>Order #{order.orderNumber}</p></div>
        <div className="amount-due"><span>Amount due</span><strong>{money.format(total)}</strong><small>USD</small></div>
      </section>
      <div className="finance-layout">
        <div className="finance-main">
          <section className="finance-section summary-section">
            <div className="section-heading"><h2>Order summary</h2></div>
            <div className="invoice-package"><div><span>Package</span><strong>{order.package.name}</strong></div><div><span>Quantity</span><strong>{number.format(order.quantity)} magnets</strong></div></div>
            <div className="line-items compact-line-items">
              {resolvedLineItems(order, now).map((item) => <div key={item.id}><div><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</div><b className={item.kind === 'discount' ? 'discount' : ''}>{item.amount < 0 ? `−${money.format(Math.abs(item.amount))}` : money.format(item.amount)}</b></div>)}
              <div><div><strong>Tax</strong></div><b>{money.format(order.tax)}</b></div>
              <div className="line-total"><div><strong>Amount due</strong></div><b>{money.format(total)}</b></div>
            </div>
          </section>
          <section className="finance-section payment-section">
            <div className="section-heading"><h2>Payment method</h2></div>
            <div className="payment-methods">
              <label className={paymentMethod === 'card' ? 'is-selected' : ''}><input type="radio" name="payment-method" value="card" checked={paymentMethod === 'card'} onChange={() => { setPaymentMethod('card'); setCheckoutRequested(false) }} /><span><strong>Credit or debit card</strong><small>Secure card payment via Stripe</small></span><b>✓</b></label>
              <label className={paymentMethod === 'ach' ? 'is-selected' : ''}><input type="radio" name="payment-method" value="ach" checked={paymentMethod === 'ach'} onChange={() => { setPaymentMethod('ach'); setCheckoutRequested(false) }} /><span><strong>ACH bank transfer</strong><small>Transfer directly from a US bank account</small></span><b>✓</b></label>
            </div>
            {paymentMethod === 'card' ? <div className="secure-fields"><div className="secure-head"><strong>Card payment</strong><small>Secured by Stripe</small></div><div className="form-grid"><label><span>Card number</span><input inputMode="numeric" placeholder="4242 4242 4242 4242" /></label><label><span>Expiry</span><input inputMode="numeric" placeholder="MM / YY" /></label><label><span>CVC</span><input inputMode="numeric" placeholder="CVC" /></label></div></div> : <div className="bank-instructions"><strong>ACH bank transfer</strong><p>Bank transfer instructions will appear here after Stripe is connected. Your order remains pending until payment is confirmed.</p></div>}
          </section>
        </div>
        <aside className="invoice-actions">
          <p className="eyebrow">AMOUNT DUE</p><strong className="payment-total">{money.format(total)}</strong>
          <button type="button" className="primary-action pay-invoice" onClick={() => setCheckoutRequested(true)}>{paymentMethod === 'card' ? 'Continue to Stripe' : 'View bank details'} <span>→</span></button>
          {checkoutRequested && <p className="backend-note">Frontend preview only — the payment provider will be connected next.</p>}
          {!externalHandoff && <button type="button" className="text-button" onClick={onBack}>Back to order</button>}
        </aside>
      </div>
    </main>
  )

  return (
    <main className="finance-shell receipt-shell">
      <header className="finance-header"><div className="brand-mark"><span>FC</span><strong>FridgeChannel</strong></div><div className="approval-state is-approved"><span />Paid</div></header>

      <section className="invoice-hero receipt-hero">
        <div><p className="eyebrow">RECEIPT</p><h1>Receipt #{order.invoiceNumber}</h1><p>Order #{order.orderNumber}</p></div>
        <div className="amount-due"><span>Total paid</span><strong>{money.format(total)}</strong><small>USD</small></div>
      </section>

      <div className="finance-layout receipt-layout">
        <div className="finance-main">
          <section className="finance-section summary-section">
            <div className="section-heading"><h2>Order details</h2></div>
            <div className="invoice-package"><div><span>Package</span><strong>{order.package.name}</strong></div><div><span>Quantity</span><strong>{number.format(order.quantity)} magnets</strong></div></div>
            <div className="line-items compact-line-items">
              {resolvedLineItems(order, now).map((item) => <div key={item.id}><div><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</div><b className={item.kind === 'discount' ? 'discount' : ''}>{item.amount < 0 ? `−${money.format(Math.abs(item.amount))}` : money.format(item.amount)}</b></div>)}
              <div><div><strong>Tax</strong></div><b>{money.format(order.tax)}</b></div>
              <div className="line-total"><div><strong>Total paid</strong></div><b>{money.format(total)}</b></div>
            </div>
          </section>

          <section className="finance-section receipt-payment-section">
            <div className="section-heading"><h2>Payment information</h2></div>
            <dl className="receipt-details">
              <div><dt>Status</dt><dd>Paid</dd></div>
              <div><dt>Payment method</dt><dd>{paymentMethodLabels[order.paymentMethod]}</dd></div>
              {order.paidAt && <div><dt>Paid on</dt><dd>{date.format(new Date(order.paidAt))}</dd></div>}
              <div><dt>Payment reference</dt><dd>{order.orderNumber}</dd></div>
            </dl>
          </section>

          {(order.billing.companyName || order.billing.contactName || order.billing.email || order.billing.address) && <section className="finance-section receipt-billing-section">
            <div className="section-heading"><h2>Billing information</h2></div>
            <dl className="receipt-details">
              {order.billing.companyName && <div><dt>Company</dt><dd>{order.billing.companyName}</dd></div>}
              {order.billing.contactName && <div><dt>Contact</dt><dd>{order.billing.contactName}</dd></div>}
              {order.billing.email && <div><dt>Email</dt><dd>{order.billing.email}</dd></div>}
              {order.billing.address && <div><dt>Billing address</dt><dd>{order.billing.address}</dd></div>}
              {order.billing.poNumber && <div><dt>PO number</dt><dd>{order.billing.poNumber}</dd></div>}
            </dl>
          </section>}
        </div>

        <aside className="invoice-actions receipt-actions">
          <button type="button" className="primary-action" onClick={() => window.print()}>Download receipt <span>↓</span></button>
          {!externalHandoff && <button type="button" className="text-button" onClick={onBack}>Back to order</button>}
        </aside>
      </div>
    </main>
  )
}
