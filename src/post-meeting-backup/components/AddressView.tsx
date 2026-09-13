import { useState, type FormEvent } from 'react'
import type { OrderState, ShippingAddress } from '../types'

export function AddressView({ order, onChange, onBack }: { order: OrderState; onChange: (order: OrderState) => void; onBack: () => void }) {
  const [address, setAddress] = useState<ShippingAddress>({ ...order.shippingAddress })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const locked = order.status === 'payment_pending' || order.status === 'paid'

  const update = (field: keyof ShippingAddress, value: string) => {
    setAddress((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: '' }))
  }

  const save = (event: FormEvent) => {
    event.preventDefault()
    if (locked) return onBack()
    const next: Record<string, string> = {}
    if (!address.recipientName.trim()) next.recipientName = 'Recipient name is required.'
    if (!address.addressLine1.trim()) next.addressLine1 = 'Street address is required.'
    if (!address.city.trim()) next.city = 'City is required.'
    if (!address.state.trim()) next.state = 'State is required.'
    if (!address.postalCode.trim()) next.postalCode = 'ZIP code is required.'
    setErrors(next)
    if (Object.keys(next).length) return
    onChange({ ...order, shippingAddress: address })
    onBack()
  }

  return (
    <main className="address-page">
      <header className="address-page-header"><button type="button" onClick={onBack} aria-label="Back to order">←</button><div><span>FC</span><strong>Delivery Address</strong></div><small>{locked ? 'Saved' : 'Order setup'}</small></header>
      <section className="address-page-shell">
        <div className="address-page-intro">
          <p>{locked ? 'DELIVERY DETAILS' : 'STEP 1 OF 2'}</p>
          <h1>{locked ? 'Delivery address' : 'Where should we deliver?'}</h1>
          <span>{locked ? 'These details are locked while payment is in progress.' : 'We’ll use this address to prepare delivery and calculate any applicable shipping.'}</span>
        </div>
        <form id="shipping-address-form" className="address-page-form form-grid" onSubmit={save} noValidate>
          <label><span>Recipient name *</span><input autoFocus disabled={locked} autoComplete="shipping name" value={address.recipientName} onChange={(e) => update('recipientName', e.target.value)} aria-invalid={!!errors.recipientName} />{errors.recipientName && <small>{errors.recipientName}</small>}</label>
          <label><span>Company</span><input disabled={locked} autoComplete="shipping organization" value={address.companyName} onChange={(e) => update('companyName', e.target.value)} /></label>
          <label className="full-field"><span>Address line 1 *</span><input disabled={locked} autoComplete="shipping address-line1" value={address.addressLine1} onChange={(e) => update('addressLine1', e.target.value)} aria-invalid={!!errors.addressLine1} />{errors.addressLine1 && <small>{errors.addressLine1}</small>}</label>
          <label className="full-field"><span>Address line 2</span><input disabled={locked} autoComplete="shipping address-line2" value={address.addressLine2} onChange={(e) => update('addressLine2', e.target.value)} placeholder="Suite, floor, building (optional)" /></label>
          <label><span>City *</span><input disabled={locked} autoComplete="shipping address-level2" value={address.city} onChange={(e) => update('city', e.target.value)} aria-invalid={!!errors.city} />{errors.city && <small>{errors.city}</small>}</label>
          <label><span>State *</span><input disabled={locked} autoComplete="shipping address-level1" value={address.state} onChange={(e) => update('state', e.target.value)} aria-invalid={!!errors.state} />{errors.state && <small>{errors.state}</small>}</label>
          <label><span>ZIP code *</span><input disabled={locked} inputMode="numeric" autoComplete="shipping postal-code" value={address.postalCode} onChange={(e) => update('postalCode', e.target.value)} aria-invalid={!!errors.postalCode} />{errors.postalCode && <small>{errors.postalCode}</small>}</label>
          <label><span>Country</span><input disabled value={address.country} /></label>
        </form>
      </section>
      <div className="address-save-bar"><button type="button" className="secondary-action" onClick={onBack}>Cancel</button><button type="submit" form="shipping-address-form" className="primary-action">{locked ? 'Back to Order' : 'Save Address'} <span>→</span></button></div>
    </main>
  )
}
