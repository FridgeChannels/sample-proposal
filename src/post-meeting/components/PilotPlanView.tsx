import { useState } from 'react'
import { orderTotal, resolvedLineItems } from '../config'
import type { FinanceHandoff, OrderState } from '../types'
import { PaymentLinkModal } from './PaymentLinkModal'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const number = new Intl.NumberFormat('en-US')
const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

function DetailsChevron() {
  return (
    <svg className="details-chevron" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

const pilotPhases = [
  {
    stage: 'Pilot Plan, Live Demo & Payment',
    timing: 'Meeting day through plan validity period',
    fridgeChannel: 'Provide the Pilot Plan, Live Demo, Dashboard account, order link, and invoice.',
    client: 'Confirm the plan; provide the data and permissions required for Dashboard configuration; enter email, shipping address, and payment information; accept the contract and terms; complete 100% payment.',
  },
  {
    stage: 'Assets & Design - Round 1',
    timing: 'Day 1-5',
    fridgeChannel: 'Submit the first Final Magnet design based on the client assets.',
    client: 'Submit the logo, copy, offer, links, and other assets; provide consolidated feedback within two business days.',
  },
  {
    stage: 'Design - Round 2 & Lock',
    timing: 'Day 6-9',
    fridgeChannel: 'Complete the second revision and Final Proof.',
    client: 'Provide the final round of consolidated feedback and confirm the final design in writing.',
  },
  {
    stage: 'Final Sample',
    timing: 'Target: Day 10-18',
    fridgeChannel: 'Produce and mail the Final Sample.',
    client: 'Inspect and confirm the Final Sample in writing within two business days of receipt.',
  },
  {
    stage: 'Mass Production & Launch',
    timing: '[Complete per production schedule]',
    fridgeChannel: 'Complete mass production and delivery of all magnets.',
    client: 'Confirm receiving and warehouse / 3PL arrangements, and place magnets into orders for the [pilot plan segment].',
  },
]

const copyToClipboard = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

export function PilotPlanView({
  order,
  now,
  onBack,
  onOpenContent,
  onHandoffCreated,
}: {
  order: OrderState
  now: number
  onBack: () => void
  onOpenContent: () => void
  onHandoffCreated: (handoff: FinanceHandoff) => void
}) {
  const [creatingLink, setCreatingLink] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const [copied, setCopied] = useState(false)
  const total = orderTotal(order, now)
  const company = order.shippingAddress.companyName || order.billing.companyName || 'Client'

  const createPaymentLink = async () => {
    setCreatingLink(true)
    setLinkError('')
    setCopied(false)
    try {
      const response = await fetch('/api/finance-handoffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order,
          total,
          baseUrl: window.location.origin,
          proposalPath: window.location.pathname,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to create the finance payment link.')
      const handoff = data.handoff as FinanceHandoff
      setPaymentUrl(handoff.paymentUrl)
      onHandoffCreated(handoff)
      try {
        await copyToClipboard(handoff.paymentUrl)
        setCopied(true)
      } catch {
        setCopied(false)
      }
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : 'Unable to create the finance payment link.')
    } finally {
      setCreatingLink(false)
    }
  }

  const copyPaymentLink = async () => {
    try {
      await copyToClipboard(paymentUrl)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <main className="pilot-plan-view">
      <div className="pilot-plan-shell">
        <header className="pilot-plan-header">
          <div className="pilot-plan-titlebar">
            <button type="button" className="plan-back-button" onClick={onBack} aria-label="Go back">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
                <path d="M9 12h10" />
              </svg>
            </button>
            <h1>Pilot Plan</h1>
          </div>
          <dl className="plan-meta">
            <div><dt>Brand</dt><dd>{company}</dd></div>
            <div><dt>Created date</dt><dd>{date.format(new Date())}</dd></div>
          </dl>
        </header>

        <section className="plan-section plan-summary">
          <h2 className="plan-section-title">1. Order summary</h2>
          <dl className="plan-order-fields">
            <div><dt>Product</dt><dd>Custom double-sided NFC fridge magnet</dd></div>
            <div><dt>Package</dt><dd>{order.package.name}</dd></div>
            <div><dt>Quantity</dt><dd>{number.format(order.quantity)} pieces</dd></div>
          </dl>
          <details className="plan-delivery-details">
            <summary>
              <span>Package delivery contents</span>
              <DetailsChevron />
            </summary>
            <div className="plan-service-groups">
              {order.package.includedServices.map((group) => (
                <div key={group.title}>
                  <h3>{group.title}</h3>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>
                        {item}
                        {item === 'Tap-to-open customer experience' && (
                          <>
                            {' '}
                            <button type="button" className="plan-sample-link" onClick={onOpenContent}>
                              View
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
          <div className="section-title-with-note plan-price-heading"><h3>Price</h3><span>Valid until {date.format(new Date(order.offerExpiresAt))}</span></div>
          <div className="plan-line-items">
            {resolvedLineItems(order, now).map((item) => (
              <div key={item.id}>
                <span>{item.label}{item.detail && <small>{item.detail}</small>}</span>
                <strong className={item.kind === 'discount' ? 'discount' : ''}>{item.amount < 0 ? `−${money.format(Math.abs(item.amount))}` : money.format(item.amount)}</strong>
              </div>
            ))}
            <div><span>Tax</span><strong>{money.format(order.tax)}</strong></div>
            <div className="plan-total"><span>Total</span><strong>{money.format(total)}</strong></div>
          </div>

          <dl className="plan-template-fields">
            <div>
              <dt>Pilot objective</dt>
              <dd>Within [30 / 45 / 60 / 90] days, run this pilot for [Target Customer Segment] by comparing customers in the same pilot segment who receive a Magnet with those who do not, based on [Core Metric].</dd>
            </div>
            <div><dt>Payment</dt><dd>100% upfront. Final Design and Final Sample begin after payment.</dd></div>
          </dl>

        </section>

        <section className="plan-section">
          <details className="plan-timeline-details" open>
            <summary>
              <h2>2. Timeline & responsibilities</h2>
              <DetailsChevron />
            </summary>
            <div className="plan-timeline">
              <div className="timeline-start">
                <span className="timeline-marker">0</span>
                <div>
                  <strong>Day 0</strong>
                  <p>FridgeChannel receives 100% payment. If client feedback is delayed, all subsequent dates move accordingly.</p>
                </div>
              </div>
              {pilotPhases.map((phase, index) => (
                <article className="plan-phase" key={phase.stage}>
                  <span className="timeline-marker">{index + 1}</span>
                  <div className="timeline-phase-content">
                    <header><span>{phase.timing}</span><h3>{phase.stage}</h3></header>
                    <dl>
                      <div><dt>FridgeChannel</dt><dd>{phase.fridgeChannel}</dd></div>
                      <div><dt>Client</dt><dd>{phase.client}</dd></div>
                    </dl>
                  </div>
                </article>
              ))}
            </div>
            <p className="plan-design-rule"><strong>Design confirmation rule:</strong> Two revision rounds plus one Final Proof are included. The client appoints one Owner and submits one set of consolidated feedback per round. Mass production does not begin without written confirmation of the Final Sample.</p>
          </details>
        </section>

      </div>

      <div className="flow-cta-bar">
        <button type="button" className="flow-cta-button" onClick={createPaymentLink} disabled={creatingLink}>
          <span>{creatingLink ? 'Creating secure link…' : 'Place Order'}</span>
          <b>→</b>
        </button>
      </div>

      {(paymentUrl || linkError) && (
        <PaymentLinkModal
          paymentUrl={paymentUrl}
          error={linkError}
          copied={copied}
          onCopy={copyPaymentLink}
          onClose={() => { setPaymentUrl(''); setLinkError('') }}
        />
      )}
    </main>
  )
}
