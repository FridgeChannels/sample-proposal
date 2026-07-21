import { useState, type FormEvent } from 'react'
import { orderSubtotal, orderTotal, resolvedLineItems } from '../config'
import type { OrderState } from '../types'
import { Modal } from './Modal'
import { SendFinanceModal } from './SendFinanceModal'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const number = new Intl.NumberFormat('en-US')

export function OrderView({ order, onChange, onOpenAddress, onOpenFinance }: { order: OrderState; onChange: (order: OrderState) => void; onOpenAddress: () => void; onOpenFinance: () => void }) {
  const [showFinance, setShowFinance] = useState(false)
  const [showApproval, setShowApproval] = useState(false)
  const [financeSent, setFinanceSent] = useState(false)
  const [notice, setNotice] = useState('')
  const [approval, setApproval] = useState({ confirmed: false, name: '', email: '', jobTitle: '' })
  const [approvalErrors, setApprovalErrors] = useState<Record<string, string>>({})
  const total = orderTotal(order)
  const isApproved = !!order.approval
  const isLocked = isApproved || order.status !== 'ready_for_approval'
  const shippingAddressText = [order.shippingAddress.addressLine1, order.shippingAddress.addressLine2, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode].filter(Boolean).join(', ')
  const hasShippingAddress = Boolean(order.shippingAddress.recipientName && order.shippingAddress.addressLine1 && order.shippingAddress.city && order.shippingAddress.state && order.shippingAddress.postalCode)

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3600)
  }

  const approve = (event: FormEvent) => {
    event.preventDefault()
    const errors: Record<string, string> = {}
    if (!approval.confirmed) errors.confirmed = 'Confirm the order terms before approval.'
    if (!approval.name.trim()) errors.name = 'Your name is required.'
    if (!/^\S+@\S+\.\S+$/.test(approval.email)) errors.email = 'Enter a valid work email.'
    setApprovalErrors(errors)
    if (Object.keys(errors).length) return
    onChange({
      ...order,
      status: 'approved',
      billing: {
        ...order.billing,
        companyName: order.billing.companyName || order.shippingAddress.companyName,
        address: order.billing.address || shippingAddressText,
      },
      approval: {
        name: approval.name.trim(), email: approval.email.trim(), jobTitle: approval.jobTitle.trim(),
        approvedAt: new Date().toISOString(), orderVersion: order.version, confirmedAmount: total,
      },
    })
    showNotice('Order approved in this front-end preview.')
  }

  const openApproval = () => {
    if (!hasShippingAddress) return onOpenAddress()
    setShowApproval(true)
  }

  const copyPaymentLink = async () => {
    const link = `${window.location.origin}${window.location.pathname}#finance`
    try { await navigator.clipboard.writeText(link); showNotice('Payment link copied.') }
    catch { showNotice(link) }
  }

  return (
    <main className="view-shell order-view">
      <div className="order-layout full-order-layout">
        <div className="order-main">
          <button className={`address-entry ${hasShippingAddress ? 'has-address' : ''}`} type="button" onClick={onOpenAddress}>
            <span className="address-icon">⌖</span><span className="address-entry-copy"><small>DELIVERY ADDRESS</small><strong>{hasShippingAddress ? order.shippingAddress.recipientName : 'Add delivery address'}</strong><span>{hasShippingAddress ? `${shippingAddressText}, ${order.shippingAddress.country}` : 'Required before placing your order'}</span></span><b>→</b>
          </button>
          <section className="order-block product-order-block">
            <div className="block-label"><span>01</span><strong>Your Package</strong></div>
            <div className="product-order-grid">
              <figure className="product-thumbnail"><img src="/pics/visual_pic.png" alt="Branded NFC fridge magnet shown in use with a smartphone" /></figure>
              <div className="product-order-copy">
                <p className="eyebrow">{order.package.campaignType}</p><h2>{order.package.name}</h2><p>{order.package.description}</p>
                <div className="product-meta"><div><span>Service</span><strong>{order.package.serviceModel}</strong></div><div><span>Integrations</span><strong>{order.package.integrations.join(' + ')}</strong></div></div>
                <div className="quantity-order-row">
                  <label><span>Magnet quantity</span><div className="quantity-control"><button type="button" disabled={isLocked || order.quantity <= 1000} onClick={() => onChange({ ...order, quantity: Math.max(1000, order.quantity - 100) })} aria-label="Decrease quantity">−</button><input type="number" min="1000" step="100" disabled={isLocked} value={order.quantity} onChange={(event) => onChange({ ...order, quantity: Math.max(1000, Number(event.target.value) || 1000) })} /><button type="button" disabled={isLocked} onClick={() => onChange({ ...order, quantity: order.quantity + 100 })} aria-label="Increase quantity">+</button></div><small>Minimum 1,000 magnets</small></label>
                </div>
              </div>
            </div>
            <div className="included-services"><div><p className="eyebrow">INCLUDED SERVICES</p><h3>Everything needed to launch.</h3></div><div><ul className="scope-grid">{order.scopeIncluded.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul><div className="not-included compact-not-included"><strong>Not included</strong><p>{order.scopeExcluded.join(' · ')}</p></div></div></div>
            <div className="order-key-details"><div><span>Estimated launch</span><strong>{order.estimatedLaunch}</strong></div></div>
            <section className="price-breakdown" aria-labelledby="price-breakdown-title">
              <h3 id="price-breakdown-title">Price breakdown</h3>
              <div className="line-items" role="table" aria-label="Order amount breakdown">
                {resolvedLineItems(order).map((item) => <div role="row" key={item.id}><div role="cell"><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</div><b role="cell" className={item.kind === 'discount' ? 'discount' : ''}>{item.amount < 0 ? `−${money.format(Math.abs(item.amount))}` : money.format(item.amount)}</b></div>)}
                <div role="row"><div role="cell"><strong>Subtotal</strong></div><b role="cell">{money.format(orderSubtotal(order))}</b></div>
                <div role="row"><div role="cell"><strong>Tax</strong><small>Calculated when applicable</small></div><b role="cell">{money.format(order.tax)}</b></div>
                <div className="line-total" role="row"><div role="cell"><strong>Total</strong><small>Estimated order total</small></div><b role="cell">{money.format(total)}</b></div>
              </div>
            </section>
            {isApproved && <div className="order-placed-message"><span>✓</span><div><strong>Order placed by {order.approval?.name}</strong><small>You can now send it to finance or continue to payment.</small></div></div>}
          </section>

          <section className="after-order-info">
            <p className="eyebrow">WHAT HAPPENS AFTER YOU ORDER</p><h2>From approval to launch.</h2>
            <ol><li><span>01</span><div><strong>Confirm creative</strong><p>Submit brand assets and approve the final magnet design.</p></div></li><li><span>02</span><div><strong>Configure & produce</strong><p>FC configures the campaign and integrations while magnet production begins.</p></div></li><li><span>03</span><div><strong>Go live</strong><p>Launch is estimated {order.estimatedLaunch.toLowerCase()}.</p></div></li></ol>
          </section>

        </div>

      </div>

      <div className={`checkout-dock ${isApproved ? 'is-placed' : ''}`} role="region" aria-label="Order checkout">
        <div className="dock-total"><span>{isApproved ? 'Order total' : `${number.format(order.quantity)} magnets`}</span><strong>{money.format(total)}</strong><small>{isApproved ? 'Order placed' : 'Estimated total'}</small></div>
        <div className="dock-actions">
          {!isApproved && <button className="primary-action" type="button" onClick={openApproval}>Place Order <span>→</span></button>}
          {isApproved && order.status === 'approved' && <><button className="primary-action" type="button" onClick={() => setShowFinance(true)}>Send to Finance <span>→</span></button><button className="secondary-action" type="button" onClick={onOpenFinance}>Pay Now <span>→</span></button></>}
          {(order.status === 'sent_to_finance' || order.status === 'viewed_by_finance' || order.status === 'payment_pending') && <><button className="primary-action" type="button" onClick={onOpenFinance}>Review Payment <span>→</span></button><button className="secondary-action" type="button" onClick={() => setShowFinance(true)}>Finance Contact <span>→</span></button></>}
          {order.status === 'paid' && <div className="dock-complete"><span>✓</span><strong>Payment Complete</strong></div>}
        </div>
      </div>

      {showApproval && <Modal title="Place Order" description={`Confirm ${number.format(order.quantity)} magnets for ${money.format(total)}.`} onClose={() => setShowApproval(false)}><form onSubmit={(event) => { approve(event); if (approval.confirmed && approval.name.trim() && /^\S+@\S+\.\S+$/.test(approval.email)) setShowApproval(false) }} noValidate><label className={`confirmation-box ${approvalErrors.confirmed ? 'has-error' : ''}`}><input type="checkbox" checked={approval.confirmed} onChange={(e) => setApproval({ ...approval, confirmed: e.target.checked })} /><span>I confirm that the package, included services, quantity, pricing, and payment terms match what was agreed with FC.</span></label>{approvalErrors.confirmed && <small className="field-error">{approvalErrors.confirmed}</small>}<div className="form-grid approval-fields"><label><span>Name *</span><input value={approval.name} onChange={(e) => setApproval({ ...approval, name: e.target.value })} aria-invalid={!!approvalErrors.name} />{approvalErrors.name && <small>{approvalErrors.name}</small>}</label><label><span>Work email *</span><input type="email" value={approval.email} onChange={(e) => setApproval({ ...approval, email: e.target.value })} aria-invalid={!!approvalErrors.email} />{approvalErrors.email && <small>{approvalErrors.email}</small>}</label><label><span>Job title</span><input value={approval.jobTitle} onChange={(e) => setApproval({ ...approval, jobTitle: e.target.value })} /></label></div><button type="submit" className="primary-action wide-action">Confirm & Place Order <span>→</span></button><p className="backend-note">This preview stores the order locally. Server audit records will connect later.</p></form></Modal>}
      {showFinance && <SendFinanceModal initial={order.financeContact} onClose={() => setShowFinance(false)} onSend={(contact) => { onChange({ ...order, financeContact: contact, billing: { ...order.billing, companyName: contact.companyName, email: contact.billingEmail, address: contact.billingAddress || '', poNumber: contact.poNumber || '' }, status: 'sent_to_finance', sentAt: new Date().toISOString() }); setShowFinance(false); setFinanceSent(true) }} />}
      {financeSent && <Modal title="Sent to Finance" description={`The order and invoice are prepared for ${order.financeContact?.email || 'your finance contact'}.`} onClose={() => setFinanceSent(false)}><div className="success-panel"><span>✓</span><p>The email delivery is a backend placeholder. You can still open and review the complete finance payment page now.</p><div className="modal-actions"><button className="secondary-action" type="button" onClick={copyPaymentLink}>Copy payment link <span>↗</span></button><button className="primary-action" type="button" onClick={onOpenFinance}>Review finance page <span>→</span></button></div></div></Modal>}
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  )
}
