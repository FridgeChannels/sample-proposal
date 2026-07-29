import { useState } from 'react'
import { orderTotal, resolvedLineItems } from '../config'
import type { OrderState, PaymentMethod, ShippingAddress } from '../types'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const number = new Intl.NumberFormat('en-US')
const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

const paymentMethodLabels: Record<PaymentMethod, string> = {
  ach: 'ACH bank transfer',
  bank_transfer: 'Bank transfer',
  card: 'Credit card',
}

export function FinanceView({ order, now, onChange, onBack, externalHandoff = false }: { order: OrderState; now: number; onChange?: (order: OrderState) => void; onBack: () => void; externalHandoff?: boolean }) {
  const total = orderTotal(order, now)
  const isPaid = order.status === 'paid' || order.financeHandoff?.status === 'paid'
  const previewEmptyShipping = import.meta.env.DEV && new URLSearchParams(window.location.search).get('previewAddress') === 'empty'
  const displayedShipping = previewEmptyShipping
    ? { recipientName: '', companyName: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: '', phone: '' }
    : order.shippingAddress
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [checkoutRequested, setCheckoutRequested] = useState(false)
  const shippingComplete = [
    displayedShipping.recipientName,
    displayedShipping.addressLine1,
    displayedShipping.city,
    displayedShipping.state,
    displayedShipping.postalCode,
    displayedShipping.country,
  ].every((value) => value.trim())
  const updateShipping = (field: keyof ShippingAddress, value: string) => {
    onChange?.({ ...order, shippingAddress: { ...order.shippingAddress, [field]: value } })
  }
  const selectPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method)
    setCheckoutRequested(false)
    onChange?.({ ...order, paymentMethod: method })
  }

  if (!isPaid) return (
    <main className="finance-shell payment-shell">
      <header className="finance-header"><div className="brand-mark"><span>FC</span><strong>FridgeChannel</strong></div></header>
      <section className="invoice-hero">
        <div><h1>Order #{order.orderNumber}</h1></div>
      </section>
      <div className="finance-layout">
        <div className="finance-main">
          <section className="finance-section summary-section">
            <div className="section-heading"><h2>Order summary</h2></div>
            <div className="invoice-package"><div><span>Package</span><strong>{order.package.name}</strong></div><div><span>Quantity</span><strong>{number.format(order.quantity)} magnets</strong></div></div>
            <p className="invoice-package-description">{order.package.description}</p>
            <details className="finance-services-details">
              <summary>
                <span>Products & included services</span>
                <svg className="finance-details-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </summary>
              <div className="finance-service-groups">
                {order.package.includedServices.map((group) => (
                  <div key={group.title}>
                    <h3>{group.title}</h3>
                    <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                ))}
              </div>
            </details>
            <div className="line-items compact-line-items">
              {resolvedLineItems(order, now).map((item) => <div key={item.id}><div><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</div><b className={item.kind === 'discount' ? 'discount' : ''}>{item.amount < 0 ? `−${money.format(Math.abs(item.amount))}` : money.format(item.amount)}</b></div>)}
              <div><div><strong>Tax</strong></div><b>{money.format(order.tax)}</b></div>
              <div className="line-total"><div><strong>Amount due</strong></div><b>{money.format(total)}</b></div>
            </div>
          </section>
          <section className="finance-section shipping-section">
            <div className="section-heading">
              <div><h2>Shipping address</h2><p>Enter the delivery location for the 1,000 pilot magnets.</p></div>
              <span className={`shipping-completion${shippingComplete ? ' is-complete' : ''}`}>{shippingComplete ? 'Complete' : 'To be completed'}</span>
            </div>
            <div className="finance-shipping-form form-grid">
              <label className="shipping-recipient"><span>Recipient name</span><input autoComplete="shipping name" placeholder="To be completed" value={displayedShipping.recipientName} onChange={(event) => updateShipping('recipientName', event.target.value)} /></label>
              <label className="shipping-company"><span>Company</span><input autoComplete="shipping organization" placeholder="To be completed" value={displayedShipping.companyName} onChange={(event) => updateShipping('companyName', event.target.value)} /></label>
              <label className="full-field"><span>Address line 1</span><input autoComplete="shipping address-line1" placeholder="To be completed" value={displayedShipping.addressLine1} onChange={(event) => updateShipping('addressLine1', event.target.value)} /></label>
              <label className="full-field"><span>Address line 2</span><input autoComplete="shipping address-line2" placeholder="Optional" value={displayedShipping.addressLine2} onChange={(event) => updateShipping('addressLine2', event.target.value)} /></label>
              <label className="shipping-city"><span>City</span><input autoComplete="shipping address-level2" placeholder="To be completed" value={displayedShipping.city} onChange={(event) => updateShipping('city', event.target.value)} /></label>
              <label className="shipping-state"><span>State</span><input autoComplete="shipping address-level1" placeholder="To be completed" value={displayedShipping.state} onChange={(event) => updateShipping('state', event.target.value)} /></label>
              <label className="shipping-zip"><span>ZIP code</span><input autoComplete="shipping postal-code" placeholder="To be completed" value={displayedShipping.postalCode} onChange={(event) => updateShipping('postalCode', event.target.value)} /></label>
              <label className="shipping-country"><span>Country</span><input autoComplete="shipping country-name" placeholder="To be completed" value={displayedShipping.country} onChange={(event) => updateShipping('country', event.target.value)} /></label>
            </div>
          </section>
        </div>
        <aside className="finance-side">
          <section className="finance-section payment-section">
            <div className="section-heading"><h2>Payment method</h2></div>
            <div className="payment-methods">
              <label className={paymentMethod === 'card' ? 'is-selected' : ''}><input type="radio" name="payment-method" value="card" checked={paymentMethod === 'card'} onChange={() => selectPaymentMethod('card')} /><span><strong>Credit or debit card</strong><small>Secure card payment via Stripe</small></span><b>✓</b></label>
            </div>
            <div className="secure-fields"><div className="secure-head"><strong>Card payment</strong><small>Secured by Stripe</small></div><div className="form-grid"><label><span>Card number</span><input inputMode="numeric" placeholder="4242 4242 4242 4242" /></label><label><span>Expiry</span><input inputMode="numeric" placeholder="MM / YY" /></label><label><span>CVC</span><input inputMode="numeric" placeholder="CVC" /></label></div></div>
          </section>
          <div className="invoice-actions">
            <p className="eyebrow">Amount due</p><strong className="payment-total">{money.format(total)}</strong>
            <button type="button" className="primary-action pay-invoice" onClick={() => setCheckoutRequested(true)}>Continue to pay <span>→</span></button>
            {checkoutRequested && <p className="backend-note">Frontend preview only — the payment provider will be connected next.</p>}
            {!externalHandoff && <button type="button" className="text-button" onClick={onBack}>Back to order</button>}
          </div>
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

          {(order.billing.companyName || order.billing.contactName || order.billing.address) && <section className="finance-section receipt-billing-section">
            <div className="section-heading"><h2>Billing information</h2></div>
            <dl className="receipt-details">
              {order.billing.companyName && <div><dt>Company</dt><dd>{order.billing.companyName}</dd></div>}
              {order.billing.contactName && <div><dt>Contact</dt><dd>{order.billing.contactName}</dd></div>}
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
