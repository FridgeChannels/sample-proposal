import { useState } from 'react'
import { orderTotal, readApiJson, resolvedLineItems, SHIPPING_OPTIONS } from '../config'
import type { FinanceHandoff, OrderState } from '../types'
import { PaymentLinkModal } from './PaymentLinkModal'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const number = new Intl.NumberFormat('en-US')
const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })
const airShipping = SHIPPING_OPTIONS.air

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
    timing: 'From the meeting date until the proposal expires',
    fridgeChannel: 'Provide the Pilot Plan, Live Demo, Dashboard access, order link, and invoice.',
    client: 'Confirm the proposal; provide Dashboard data and permissions; enter email, shipping, and payment details; accept the terms; and pay 100%.',
  },
  {
    stage: 'Brand Design & Design Lock',
    timing: 'From Day 1 until written approval',
    fridgeChannel: 'Provide Magnet dimensions, the design template, and specifications. After the 24-hour revision window, review the final files for production and confirm Design Lock.',
    client: 'Email print-ready CMYK files for both sides. Revisions are allowed within 24 hours of the first submission; confirm the final version by email.',
  },
  {
    stage: 'Final Sample Review',
    timing: 'After Design Lock',
    fridgeChannel: 'Produce the Final Sample and present the physical result in a remote video review so Brand can confirm color, finish, size, TAP, and content.',
    client: 'Join the video review. If the sample is approved, confirm by email so mass production can begin.',
  },
  {
    stage: 'Mass Production & Launch',
    timing: 'About 14 business days after email confirmation of the Final Sample',
    fridgeChannel: 'Complete mass production and deliver the full Magnet quantity door-to-door to the confirmed warehouse or 3PL.',
    client: 'Confirm receipt and warehouse/3PL fulfillment, then add Magnets to orders for the Pilot Plan target segments.',
  },
]

const formatDate = (value?: string) => {
  const parsed = value ? Date.parse(value) : Number.NaN
  return Number.isFinite(parsed) ? date.format(new Date(parsed)) : '—'
}

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
  magnetSn,
  now,
  onBack,
  onOpenContent,
  onViewReceipt,
  onHandoffCreated,
}: {
  order: OrderState
  magnetSn: string
  now: number
  onBack: () => void
  onOpenContent: () => void
  onViewReceipt: () => void
  onHandoffCreated: (handoff: FinanceHandoff, dbOrderId: number) => void
}) {
  const [creatingLink, setCreatingLink] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const [copied, setCopied] = useState(false)
  const total = orderTotal(order, now)
  const brand = order.brandName || order.shippingAddress.companyName || 'Client'
  const createdDate = formatDate(order.createdAt)
  const isPaid = order.status === 'paid' || order.financeHandoff?.status === 'paid'
  const pilotObjective = order.pilot?.durationDays && order.pilot.kpi
    ? `Within ${order.pilot.durationDays} days, run this pilot on customers who complete their first order and receive a Magnet, measuring ${order.pilot.kpi} across the full pilot cohort.`
    : 'Within [30 / 45 / 60 / 90] days, run this pilot on customers who complete their first order and receive a Magnet, measuring [Core Metric] across the full pilot cohort.'

  const createPaymentLink = async () => {
    if (isPaid) {
      onViewReceipt()
      return
    }
    if (!magnetSn) {
      setLinkError('Missing magnet serial number.')
      return
    }
    setCreatingLink(true)
    setLinkError('')
    setCopied(false)
    try {
      const response = await fetch('/api/finance-handoffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sn: magnetSn,
          quantity: order.quantity,
          baseUrl: window.location.origin,
          proposalPath: window.location.pathname,
          shippingMethod: 'air',
        }),
      })
      const data = await readApiJson<{ handoff: FinanceHandoff; orderId: number }>(
        response,
        'Unable to create the finance payment link.',
      )
      const handoff = data.handoff
      setPaymentUrl(handoff.paymentUrl)
      onHandoffCreated(handoff, data.orderId)
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
            <div><dt>Brand</dt><dd>{brand}</dd></div>
            <div><dt>Created date</dt><dd>{createdDate}</dd></div>
            {isPaid && <div><dt>Status</dt><dd className="plan-paid-status"><span aria-hidden="true" />Paid</dd></div>}
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
          <div className="section-title-with-note plan-price-heading"><h3>Price</h3><span>Valid until {formatDate(order.offerExpiresAt)}</span></div>
          <div className="plan-line-items">
            {resolvedLineItems(order, now).map((item) => (
              <div key={item.id}>
                <span>{item.label}{item.detail && <small>{item.detail}</small>}</span>
                <strong className={item.kind === 'discount' ? 'discount' : ''}>{item.amount < 0 ? `−${money.format(Math.abs(item.amount))}` : money.format(item.amount)}</strong>
              </div>
            ))}
            <div className="plan-shipping-options" aria-label="Shipping">
              <span className="plan-shipping-label">Shipping</span>
              <div className="plan-shipping-fixed">
                <span>
                  <strong>{airShipping.label}</strong>
                  <small>{airShipping.eta}</small>
                </span>
                <b>{money.format(airShipping.fee)}</b>
              </div>
            </div>
            <div className="plan-total"><span>Total</span><strong>{money.format(total)}</strong></div>
          </div>

          <dl className="plan-template-fields">
            <div>
              <dt>Pilot objective</dt>
              <dd>{pilotObjective}</dd>
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
                  <p>FC receives 100% payment. The brand provides the design. Revision rounds determine the Design Lock date, which shifts all later milestones.</p>
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
          </details>
        </section>

      </div>

      <div className="flow-cta-bar plan-order-cta">
        <button type="button" className={`flow-cta-button${isPaid ? ' is-paid' : ''}`} onClick={isPaid ? onViewReceipt : createPaymentLink} disabled={!isPaid && (creatingLink || !order.pricing.loaded)}>
          <span>{isPaid ? 'View receipt' : creatingLink ? 'Creating secure link…' : 'Place Order'}</span>
          <b>→</b>
        </button>
      </div>

      {!isPaid && (paymentUrl || linkError) && (
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
