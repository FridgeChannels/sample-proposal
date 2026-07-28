import { useState, type FormEvent } from 'react'
import type { FinanceContact, FinanceHandoff } from '../types'
import { Modal } from './Modal'

export function SendFinanceModal({ initial, onClose, onSend }: { initial?: FinanceContact; onClose: () => void; onSend: (contact: FinanceContact) => Promise<FinanceHandoff> }) {
  const [contact, setContact] = useState<FinanceContact>(initial ? { ...initial, ccCurrentContact: false } : { name: '', email: '', companyName: '', billingEmail: '', ccCurrentContact: false, message: '' })
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const update = (field: keyof FinanceContact, value: string | boolean) => setContact(current => ({ ...current, [field]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(contact.email)) return setError('Enter a valid finance email.')
    setSending(true); setError('')
    try { await onSend({ ...contact, name: '', billingEmail: contact.email, ccCurrentContact: false }); onClose() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to send. Try again.'); setSending(false) }
  }

  return (
    <Modal ariaLabel="Send to Finance" onClose={onClose}>
      <form className="finance-handoff-form" onSubmit={submit} noValidate>
        <label><span>Finance email *</span><input autoFocus type="email" placeholder="finance@company.com" value={contact.email} onChange={e => update('email', e.target.value)} aria-invalid={!!error} />{error && <small className="field-error">{error}</small>}</label>
        <label><span>Add a note</span><textarea rows={3} value={contact.message} onChange={e => update('message', e.target.value)} placeholder="Optional" /></label>
        <button type="submit" className="primary-action wide-action" disabled={sending}>{sending ? 'Sending secure link…' : 'Send secure link'} <span>{sending ? '…' : '→'}</span></button>
      </form>
    </Modal>
  )
}
