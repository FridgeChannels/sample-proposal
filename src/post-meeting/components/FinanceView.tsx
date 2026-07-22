import { useEffect, useState, type FormEvent } from 'react'
import { orderTotal, resolvedLineItems, statusLabels } from '../config'
import type { BillingDetails, OrderState, PaymentMethod } from '../types'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const number = new Intl.NumberFormat('en-US')
const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

const paymentMethods: Array<{ id: PaymentMethod; name: string; note: string }> = [
  { id: 'ach', name: 'ACH', note: 'Recommended · No processing fee' },
  { id: 'bank_transfer', name: 'Bank transfer', note: 'Instructions provided after confirmation' },
  { id: 'card', name: 'Credit card', note: 'Processing fee may apply and will be disclosed first' },
]

export function FinanceView({ order, now, onChange, onBack, externalHandoff = false }: { order: OrderState; now: number; onChange: (order: OrderState) => void; onBack: () => void; externalHandoff?: boolean }) {
  const [billing, setBilling] = useState<BillingDetails>(order.billing)
  const [notice, setNotice] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [paymentFields, setPaymentFields] = useState({ accountName: '', routing: '', account: '', cardName: '', cardNumber: '', expiry: '', cvc: '' })
  const total = orderTotal(order, now)
  const locked = order.status === 'payment_pending' || order.status === 'paid'
  const billingReady = Boolean(billing.companyName.trim() && billing.contactName.trim() && /^\S+@\S+\.\S+$/.test(billing.email) && billing.address.trim())
  const methodReady = order.paymentMethod === 'bank_transfer'
    || (order.paymentMethod === 'ach' && Boolean(paymentFields.accountName && paymentFields.routing && paymentFields.account))
    || (order.paymentMethod === 'card' && Boolean(paymentFields.cardName && paymentFields.cardNumber && paymentFields.expiry && paymentFields.cvc))
  const paymentReady = billingReady && methodReady

  const updateHandoffStatus = (status: 'viewed' | 'payment_pending' | 'paid') => {
    const token = order.financeHandoff?.token
    if (!token) return
    fetch(`/api/finance-handoffs/${token}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }).catch(() => undefined)
  }

  useEffect(() => {
    if (order.status === 'sent_to_finance') onChange({ ...order, status: 'viewed_by_finance' })
  }, [order, onChange])

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3600)
  }

  const updateBilling = (field: keyof BillingDetails, value: string) => setBilling((current) => ({ ...current, [field]: value }))

  const validateBilling = () => {
    const next: Record<string, string> = {}
    if (!billing.companyName.trim()) next.companyName = 'Billing company is required.'
    if (!billing.contactName.trim()) next.contactName = 'Billing contact is required.'
    if (!/^\S+@\S+\.\S+$/.test(billing.email)) next.email = 'Enter a valid finance email.'
    if (!billing.address.trim()) next.address = 'Billing address is required.'
    return next
  }

  const saveBilling = () => {
    const next = validateBilling()
    setErrors(next)
    if (Object.keys(next).length) return false
    onChange({ ...order, billing })
    showNotice('Billing details saved in this front-end preview.')
    return true
  }

  const startPayment = (event: FormEvent) => {
    event.preventDefault()
    const next = validateBilling()
    if (order.paymentMethod === 'ach' && (!paymentFields.accountName || !paymentFields.routing || !paymentFields.account)) next.payment = 'Complete the ACH account fields.'
    if (order.paymentMethod === 'card' && (!paymentFields.cardName || !paymentFields.cardNumber || !paymentFields.expiry || !paymentFields.cvc)) next.payment = 'Complete the card fields.'
    setErrors(next)
    if (Object.keys(next).length) return
    onChange({ ...order, billing, status: 'payment_pending' })
    updateHandoffStatus('payment_pending')
    showNotice('Payment is pending. No funds were moved — secure payment processing requires the backend.')
  }

  const copyPaymentLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); showNotice('Payment link copied.') }
    catch { showNotice(window.location.href) }
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

      {order.status === 'payment_pending' && <section className="payment-state-panel"><span>↗</span><div><strong>{order.paymentMethod === 'bank_transfer' ? 'Bank Transfer Pending' : 'Payment Pending'}</strong><p>A secure payment provider or FC confirmation will update this invoice. No payment was processed by this preview.</p></div></section>}
      {order.status === 'paid' && <section className="payment-state-panel paid-panel"><span>✓</span><div><strong>Payment Complete</strong><p>Paid {order.paidAt ? date.format(new Date(order.paidAt)) : ''} · {money.format(total)} · {paymentMethods.find((method) => method.id === order.paymentMethod)?.name}</p><small>Your project is ready to move into implementation.</small></div></section>}

      <div className="finance-layout">
        <div className="finance-main">
          <section className="finance-section customer-section">
            <div className="section-heading"><span>01</span><h2>Customer Information</h2></div>
            <div className="form-grid billing-form">
              <label><span>Billing company name *</span><input disabled={locked} value={billing.companyName} onChange={(e) => updateBilling('companyName', e.target.value)} aria-invalid={!!errors.companyName} />{errors.companyName && <small>{errors.companyName}</small>}</label>
              <label><span>Billing contact *</span><input disabled={locked} value={billing.contactName} onChange={(e) => updateBilling('contactName', e.target.value)} aria-invalid={!!errors.contactName} />{errors.contactName && <small>{errors.contactName}</small>}</label>
              <label><span>Finance email *</span><input disabled={locked} type="email" value={billing.email} onChange={(e) => updateBilling('email', e.target.value)} aria-invalid={!!errors.email} />{errors.email && <small>{errors.email}</small>}</label>
              <label><span>PO Number</span><input disabled={locked} value={billing.poNumber} onChange={(e) => updateBilling('poNumber', e.target.value)} /></label>
              <label className="full-field"><span>Billing address *</span><textarea disabled={locked} rows={3} value={billing.address} onChange={(e) => updateBilling('address', e.target.value)} aria-invalid={!!errors.address} />{errors.address && <small>{errors.address}</small>}</label>
            </div>
            {!locked && <button type="button" className="secondary-action save-billing" onClick={saveBilling}>Save billing details <span>✓</span></button>}
          </section>

          <section className="finance-section summary-section">
            <div className="section-heading"><span>02</span><h2>Invoice Summary</h2></div>
            <div className="invoice-package"><div><span>Package</span><strong>{order.package.name}</strong></div><div><span>Quantity</span><strong>{number.format(order.quantity)} magnets</strong></div></div>
            <div className="line-items compact-line-items">
              {resolvedLineItems(order, now).map((item) => <div key={item.id}><div><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</div><b className={item.kind === 'discount' ? 'discount' : ''}>{item.amount < 0 ? `−${money.format(Math.abs(item.amount))}` : money.format(item.amount)}</b></div>)}
              <div><div><strong>Tax</strong></div><b>{money.format(order.tax)}</b></div><div className="line-total"><div><strong>Amount due</strong></div><b>{money.format(total)}</b></div>
            </div>
          </section>

          <section className="finance-section approval-section">
            <div className="section-heading"><span>03</span><h2>Business Approval</h2></div>
            <div className="approval-record"><span className="approval-check">✓</span><div><strong>Approved by {order.approval.name}</strong><p>{order.approval.jobTitle || 'Business approver'} · {order.approval.email}</p><small>{date.format(new Date(order.approval.approvedAt))} · Version {order.approval.orderVersion}</small></div></div>
          </section>

          <form className="finance-section payment-section" onSubmit={startPayment}>
            <div className="section-heading"><span>04</span><h2>Payment Method</h2></div>
            <div className="payment-methods">{paymentMethods.map((method) => <label key={method.id} className={order.paymentMethod === method.id ? 'is-selected' : ''}><input type="radio" name="payment-method" value={method.id} disabled={locked} checked={order.paymentMethod === method.id} onChange={() => onChange({ ...order, paymentMethod: method.id })} /><span><strong>{method.name}</strong><small>{method.note}</small></span><b>✓</b></label>)}</div>

            {!locked && order.paymentMethod === 'ach' && <div className="secure-fields"><div className="secure-head"><strong>Bank account</strong><small>Secure provider fields placeholder</small></div><div className="form-grid"><label><span>Account holder name</span><input value={paymentFields.accountName} onChange={(e) => setPaymentFields({ ...paymentFields, accountName: e.target.value })} /></label><label><span>Routing number</span><input inputMode="numeric" value={paymentFields.routing} onChange={(e) => setPaymentFields({ ...paymentFields, routing: e.target.value })} /></label><label className="full-field"><span>Account number</span><input inputMode="numeric" value={paymentFields.account} onChange={(e) => setPaymentFields({ ...paymentFields, account: e.target.value })} /></label></div></div>}
            {!locked && order.paymentMethod === 'card' && <div className="secure-fields"><div className="secure-head"><strong>Card details</strong><small>Secure provider fields placeholder</small></div><div className="form-grid"><label className="full-field"><span>Name on card</span><input value={paymentFields.cardName} onChange={(e) => setPaymentFields({ ...paymentFields, cardName: e.target.value })} /></label><label className="full-field"><span>Card number</span><input inputMode="numeric" autoComplete="cc-number" value={paymentFields.cardNumber} onChange={(e) => setPaymentFields({ ...paymentFields, cardNumber: e.target.value })} /></label><label><span>Expiry</span><input placeholder="MM / YY" autoComplete="cc-exp" value={paymentFields.expiry} onChange={(e) => setPaymentFields({ ...paymentFields, expiry: e.target.value })} /></label><label><span>CVC</span><input inputMode="numeric" autoComplete="cc-csc" value={paymentFields.cvc} onChange={(e) => setPaymentFields({ ...paymentFields, cvc: e.target.value })} /></label></div></div>}
            {!locked && order.paymentMethod === 'bank_transfer' && <div className="bank-instructions"><strong>Bank transfer instructions</strong><p>FC bank details and a unique payment reference will be supplied by the secure backend. Transfer status remains pending until funds are confirmed.</p></div>}
            {errors.payment && <small className="field-error">{errors.payment}</small>}
            {!locked && <><button className="primary-action pay-invoice" type="submit" disabled={!paymentReady}>{paymentReady ? 'Pay Invoice' : 'Complete details to pay'} <span>{paymentReady ? '→' : '↓'}</span></button><p className="backend-note">Front-end preview only. The secure provider connection is intentionally empty, so this action cannot move funds.</p></>}
          </form>
        </div>

        <aside className="invoice-actions">
          <p className="eyebrow">INVOICE ACTIONS</p><button type="button" className="primary-action" onClick={() => window.print()}>Download Invoice <span>↓</span></button><button type="button" className="secondary-action" onClick={copyPaymentLink}>Copy Payment Link <span>↗</span></button><a className="secondary-action" href={`mailto:?subject=${encodeURIComponent(`Question about invoice ${order.invoiceNumber}`)}`}>Contact FC <span>↗</span></a>{!externalHandoff && <button type="button" className="text-button" onClick={onBack}>Back to project order</button>}<div className="need-changes"><strong>Need changes to this invoice?</strong><p>Finance cannot change package, quantity, scope, unit price, or total. Contact FC to issue a new order version.</p></div>
        </aside>
      </div>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  )
}
