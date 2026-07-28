import { Modal } from './Modal'

type PaymentLinkModalProps = {
  paymentUrl: string
  error: string
  copied: boolean
  onCopy: () => void
  onClose: () => void
}

export function PaymentLinkModal({ paymentUrl, error, copied, onCopy, onClose }: PaymentLinkModalProps) {
  return (
    <Modal
      title={error ? 'Unable to create payment link' : 'Finance payment link ready'}
      description={error || 'Copy this secure link and send it to your finance team. No payment is taken on this page.'}
      onClose={onClose}
    >
      {!error && (
        <div className="payment-link-result">
          <label>
            <span>Secure payment link</span>
            <input value={paymentUrl} readOnly onFocus={(event) => event.currentTarget.select()} />
          </label>
          <button type="button" className="primary-action" onClick={onCopy}>
            {copied ? 'Link copied' : 'Copy link'} <span>{copied ? '✓' : '⧉'}</span>
          </button>
          <a className="secondary-action payment-link-open" href={paymentUrl} target="_blank" rel="noreferrer">
            Preview finance page <span>↗</span>
          </a>
        </div>
      )}
    </Modal>
  )
}
