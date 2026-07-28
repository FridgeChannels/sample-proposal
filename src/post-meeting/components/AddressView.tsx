import { useState, type FormEvent } from 'react'
import { snFromLocation } from '../config'
import type { OrderState, ShippingAddress } from '../types'

export function AddressView({ order, onChange, onBack }: { order: OrderState; onChange: (order: OrderState) => void; onBack: () => void }) {
  const [address, setAddress] = useState<ShippingAddress>({
    phone: '',
    email: '',
    ...order.shippingAddress,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const locked = !!order.approval

  const update = (field: keyof ShippingAddress, value: string) => {
    setAddress((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: '' }))
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (locked) return onBack()
    const next: Record<string, string> = {}
    if (!address.recipientName.trim()) next.recipientName = 'Recipient name is required.'
    if (!String(address.phone || '').trim()) next.phone = 'Phone is required.'
    if (!address.addressLine1.trim()) next.addressLine1 = 'Street address is required.'
    if (!address.city.trim()) next.city = 'City is required.'
    if (!address.state.trim()) next.state = 'State is required.'
    if (!address.postalCode.trim()) next.postalCode = 'ZIP code is required.'
    setErrors(next)
    if (Object.keys(next).length) return

    const sn = order.pricing.magnetSn || snFromLocation()
    if (!sn) {
      setNotice('Missing sample SN — open this page via /p/{sn}.')
      return
    }

    setSaving(true)
    setNotice('')
    try {
      const response = await fetch('/api/pilot-orders/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sn, address }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to save address.')
      onChange({
        ...order,
        shippingAddress: {
          ...address,
          ...data.address,
          companyName: address.companyName,
        },
        shippingAddressId: data.address.id,
      })
      onBack()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to save address.')
      setSaving(false)
    }
  }

  return (
    <main className="address-page">
      <header className="address-page-header"><button type="button" onClick={onBack} aria-label="Back to order">←</button><div><span>FC</span><strong>Delivery Address</strong></div><small>{locked ? 'Saved' : 'Order setup'}</small></header>
      <section className="address-page-shell">
        <form id="shipping-address-form" className="address-page-form form-grid" onSubmit={save} noValidate>
          <label><span>Recipient name *</span><input autoFocus disabled={locked || saving} autoComplete="shipping name" value={address.recipientName} onChange={(e) => update('recipientName', e.target.value)} aria-invalid={!!errors.recipientName} />{errors.recipientName && <small>{errors.recipientName}</small>}</label>
          <label><span>Phone *</span><input disabled={locked || saving} autoComplete="tel" value={address.phone || ''} onChange={(e) => update('phone', e.target.value)} aria-invalid={!!errors.phone} />{errors.phone && <small>{errors.phone}</small>}</label>
          <label><span>Company</span><input disabled={locked || saving} autoComplete="shipping organization" value={address.companyName} onChange={(e) => update('companyName', e.target.value)} /></label>
          <label><span>Email</span><input disabled={locked || saving} type="email" autoComplete="email" value={address.email || ''} onChange={(e) => update('email', e.target.value)} /></label>
          <label className="full-field"><span>Address line 1 *</span><input disabled={locked || saving} autoComplete="shipping address-line1" value={address.addressLine1} onChange={(e) => update('addressLine1', e.target.value)} aria-invalid={!!errors.addressLine1} />{errors.addressLine1 && <small>{errors.addressLine1}</small>}</label>
          <label className="full-field"><span>Address line 2</span><input disabled={locked || saving} autoComplete="shipping address-line2" value={address.addressLine2} onChange={(e) => update('addressLine2', e.target.value)} placeholder="Suite, floor, building (optional)" /></label>
          <label><span>City *</span><input disabled={locked || saving} autoComplete="shipping address-level2" value={address.city} onChange={(e) => update('city', e.target.value)} aria-invalid={!!errors.city} />{errors.city && <small>{errors.city}</small>}</label>
          <label><span>State *</span><input disabled={locked || saving} autoComplete="shipping address-level1" value={address.state} onChange={(e) => update('state', e.target.value)} aria-invalid={!!errors.state} />{errors.state && <small>{errors.state}</small>}</label>
          <label><span>ZIP code *</span><input disabled={locked || saving} inputMode="numeric" autoComplete="shipping postal-code" value={address.postalCode} onChange={(e) => update('postalCode', e.target.value)} aria-invalid={!!errors.postalCode} />{errors.postalCode && <small>{errors.postalCode}</small>}</label>
          <label><span>Country</span><input disabled value={address.country} /></label>
        </form>
      </section>
      <div className="address-save-bar">
        <button type="button" className="secondary-action" onClick={onBack}>Cancel</button>
        <button type="submit" form="shipping-address-form" className="primary-action" disabled={saving}>
          {locked ? 'Back to Order' : saving ? 'Saving…' : 'Save Address'} <span>→</span>
        </button>
      </div>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  )
}
