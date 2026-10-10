import { liveDemoUrlForSn, LIVE_DEMO_URL, snFromLocation } from '../config'

/**
 * Live demo iframe: same /p/{sn} shape as the customer sample URL,
 * with SN taken from the current path (or ?sn=) instead of a hardcoded value.
 */
export function LiveDemoView({
  active,
  aboutLoading = false,
  onAboutFridgeChannel,
}: {
  active: boolean
  aboutLoading?: boolean
  onAboutFridgeChannel: () => void
}) {
  const sn = snFromLocation()
  const src = sn ? liveDemoUrlForSn(sn) : LIVE_DEMO_URL

  return (
    <main className={`live-demo-view has-flow-cta${active ? '' : ' is-preserved-hidden'}`} aria-hidden={!active}>
      <iframe
        src={src}
        title="FridgeChannel live demo"
        loading="eager"
        allow="clipboard-read; clipboard-write; fullscreen"
        allowFullScreen
      />
      <div className="flow-cta-bar">
        <button type="button" className="flow-cta-button" onClick={onAboutFridgeChannel} disabled={aboutLoading}>
          <span>{aboutLoading ? 'Opening…' : 'About FridgeChannel'}</span>
          <b>→</b>
        </button>
        <div className="flow-contact-row">
          <nav className="flow-contact-options" aria-label="Contact FridgeChannel directly">
            <a className="flow-contact-option" href="sms:+16208941711" aria-label="Send an SMS to FridgeChannel">
              <img src="/assets/contact/sms.svg" alt="" />
            </a>
            <a className="flow-contact-option" href="https://wa.me/16208941711" aria-label="Message FridgeChannel on WhatsApp">
              <img src="/assets/contact/whatsapp.svg" alt="" />
            </a>
            <a className="flow-contact-option" href="mailto:ella@fridgechannels.com" aria-label="Email FridgeChannel">
              <img src="/assets/contact/gmail.svg" alt="" />
            </a>
          </nav>
          <p className="flow-copyright">© 2026 FridgeChannel, All rights reserved</p>
        </div>
      </div>
    </main>
  )
}
