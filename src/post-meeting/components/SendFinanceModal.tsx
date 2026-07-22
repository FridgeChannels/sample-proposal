import { useState, type FormEvent } from 'react'
import type { FinanceContact, FinanceHandoff } from '../types'
import { Modal } from './Modal'

export function SendFinanceModal({ initial, approverEmail, onClose, onSend }: { initial?: FinanceContact; approverEmail: string; onClose: () => void; onSend: (contact: FinanceContact) => Promise<FinanceHandoff> }) {
  const [contact, setContact] = useState<FinanceContact>(initial || { name: '', email: '', companyName: '', billingEmail: '', ccCurrentContact: true, message: '' })
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const update = (field: keyof FinanceContact, value: string | boolean) => setContact(current => ({ ...current, [field]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(contact.email)) return setError('Enter a valid finance email.')
    setSending(true); setError('')
    try { await onSend({ ...contact, billingEmail: contact.email }); onClose() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to send. Try again.'); setSending(false) }
  }

  return (
    <Modal title="Send to Finance" description="Send the approved order and a secure payment link." onClose={onClose}>
      <form className="finance-handoff-form" onSubmit={submit} noValidate>
        <label><span>Finance email *</span><input autoFocus type="email" placeholder="finance@company.com" value={contact.email} onChange={e => update('email', e.target.value)} aria-invalid={!!error} />{error && <small className="field-error">{error}</small>}</label>
        <label><span>Contact name <small>Optional</small></span><input value={contact.name} onChange={e => update('name', e.target.value)} placeholder="Finance team" /></label>
        <details><summary>Add a note</summary><textarea rows={3} value={contact.message} onChange={e => update('message', e.target.value)} placeholder="Optional context for your finance team" /></details>
        <label className="check-row"><input type="checkbox" checked={contact.ccCurrentContact} onChange={e => update('ccCurrentContact', e.target.checked)} /><span>CC me at {approverEmail}</span></label>
        <div className="handoff-email-preview"><small>THEY WILL RECEIVE</small><strong>Approved order · Invoice · Secure payment link</strong><span>No bank or card details are sent by email.</span></div>
        <button type="submit" className="primary-action wide-action" disabled={sending}>{sending ? 'Sending secure link…' : 'Send secure link'} <span>{sending ? '…' : '→'}</span></button>
      </form>
    </Modal>
  )
}
