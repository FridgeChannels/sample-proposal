import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export function ChannelEconomics({ channel }: { channel: 'DTC' | 'Amazon' }) {
  const isAmazon = channel === 'Amazon'
  const titleId = useId()
  const modelPath = isAmazon ? 'hommio_amazon_hph_dashboard.html' : 'hommio_hph_dashboard.html'
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.showModal()
    return () => { document.body.style.overflow = previous; trigger.current?.focus() }
  }, [open])
  return <>
    <div className="channel-economics-summary">
      <p className="economics-summary-intro">One Hommio Retention Household, with two attributed {channel} orders per year.</p>
      <p className="economics-summary-period">Illustrative year 1 · Per household · USD</p>
      <dl className="economics-summary-metrics">
        <div><dt>Allocated hardware</dt><dd>$5</dd><small>One-time investment per HRH</small></div>
        <div><dt>Attributed revenue</dt><dd className="economics-revenue-value">+$100
          <span className="economics-coin-burst" aria-hidden="true">
            <span>$</span><span>+</span><span>$</span>
          </span>
        </dd><small>2 modeled orders × $50 net AOV</small></div>
      </dl>
      <p className="economics-summary-note">Illustrative assumptions, not observed results or profit. Other brand costs are excluded.</p>
      <button ref={trigger} className="economics-explore" onClick={() => setOpen(true)}>Explore economics <span aria-hidden="true">↗</span></button>
    </div>
    {open && createPortal(<dialog ref={dialog} className="economics-fullscreen" aria-labelledby={titleId} onCancel={() => setOpen(false)}>
      <header><h2 id={titleId}>{channel} household economics</h2><button autoFocus onClick={() => setOpen(false)} aria-label="Close economics model">Close <span aria-hidden="true">×</span></button></header>
      <iframe src={`/gourmendfoods/${modelPath}`} title={`Interactive ${channel} household economics model`} sandbox="allow-scripts" />
    </dialog>, document.body)}
  </>
}
