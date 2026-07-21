import { useState, type FormEvent } from 'react'
import type { FinanceContact } from '../types'
import { Modal } from './Modal'

const emptyContact: FinanceContact = {
  name: '', email: '', companyName: '', billingEmail: '', ccCurrentContact: true,
  poNumber: '', billingAddress: '', message: '', accountsPayableEmail: '', taxExemptionInfo: '',
}

export function SendFinanceModal({ initial, onClose, onSend }: { initial?: FinanceContact; onClose: () => void; onSend: (contact: FinanceContact) => void }) {
  const [contact, setContact] = useState<FinanceContact>(initial || emptyContact)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const update = (field: keyof FinanceContact, value: string | boolean) => setContact((current) => ({ ...current, [field]: value }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!contact.name.trim()) nextErrors.name = 'Finance contact name is required.'
    if (!/^\S+@\S+\.\S+$/.test(contact.email)) nextErrors.email = 'Enter a valid finance email.'
    if (!contact.companyName.trim()) nextErrors.companyName = 'Billing company name is required.'
    if (!/^\S+@\S+\.\S+$/.test(contact.billingEmail)) nextErrors.billingEmail = 'Enter a valid billing email.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) onSend(contact)
  }

  return (
    <Modal title="Send to Finance" description="We’ll prepare the order summary, invoice, and secure payment link for your finance contact." onClose={onClose}>
      <form className="finance-form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <label><span>Finance contact name *</span><input value={contact.name} onChange={(e) => update('name', e.target.value)} aria-invalid={!!errors.name} />{errors.name && <small>{errors.name}</small>}</label>
          <label><span>Finance email *</span><input type="email" value={contact.email} onChange={(e) => update('email', e.target.value)} aria-invalid={!!errors.email} />{errors.email && <small>{errors.email}</small>}</label>
          <label><span>Billing company name *</span><input value={contact.companyName} onChange={(e) => update('companyName', e.target.value)} aria-invalid={!!errors.companyName} />{errors.companyName && <small>{errors.companyName}</small>}</label>
          <label><span>Billing email *</span><input type="email" value={contact.billingEmail} onChange={(e) => update('billingEmail', e.target.value)} aria-invalid={!!errors.billingEmail} />{errors.billingEmail && <small>{errors.billingEmail}</small>}</label>
          <label><span>PO Number</span><input value={contact.poNumber} onChange={(e) => update('poNumber', e.target.value)} /></label>
          <label><span>Accounts Payable email</span><input type="email" value={contact.accountsPayableEmail} onChange={(e) => update('accountsPayableEmail', e.target.value)} /></label>
          <label className="full-field"><span>Billing address</span><textarea rows={3} value={contact.billingAddress} onChange={(e) => update('billingAddress', e.target.value)} /></label>
          <label className="full-field"><span>Message</span><textarea rows={3} value={contact.message} onChange={(e) => update('message', e.target.value)} placeholder="Optional note for the finance team" /></label>
          <label className="full-field"><span>Tax exemption information</span><input value={contact.taxExemptionInfo} onChange={(e) => update('taxExemptionInfo', e.target.value)} /></label>
        </div>
        <label className="check-row"><input type="checkbox" checked={contact.ccCurrentContact} onChange={(e) => update('ccCurrentContact', e.target.checked)} /><span>CC me on the finance handoff</span></label>
        <p className="backend-note">Front-end preview: email delivery and secure-link generation will connect to the backend later.</p>
        <div className="modal-actions"><button type="button" className="text-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-action">Send to Finance <span>→</span></button></div>
      </form>
    </Modal>
  )
}
