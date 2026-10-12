import { useState, type CSSProperties } from 'react'

const fabStyle: CSSProperties = {
  position: 'fixed',
  zIndex: 1200,
  right: 'calc(-30px + env(safe-area-inset-right, 0px))',
  bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
  display: 'grid',
  justifyItems: 'end',
  gap: 10,
  transition: 'right 180ms ease-out',
}

const openFabStyle: CSSProperties = {
  right: 'max(16px, calc((100% - 960px) / 2))',
}

const actionStyle: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 44,
  height: 44,
  border: 0,
  borderRadius: '50%',
  background: '#fff',
  boxShadow: '0 6px 16px rgba(18, 31, 27, 0.16)',
  textDecoration: 'none',
}

const buttonStyle: CSSProperties = {
  ...actionStyle,
  width: 52,
  height: 52,
  padding: 0,
  lineHeight: 0,
  background: 'var(--leg-brand, #17382b)',
  boxShadow: '0 8px 20px color-mix(in oklch, var(--leg-brand, #17382b) 28%, transparent)',
  cursor: 'pointer',
}

/** Persistent, low-friction contact entry shared by the DTC and About pages. */
export function FloatingContactButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{ ...fabStyle, ...(isOpen ? openFabStyle : {}) }}>
      {isOpen && (
        <nav style={{ display: 'grid', gap: 10, width: 'max-content', margin: 0 }} aria-label="Contact FridgeChannel directly">
          <a style={actionStyle} href="sms:+16208941711" aria-label="Send an SMS to FridgeChannel">
            <img src="/assets/contact/sms.svg" width="28" height="28" alt="" />
          </a>
          <a style={actionStyle} href="https://wa.me/16208941711" aria-label="Message FridgeChannel on WhatsApp">
            <img src="/assets/contact/whatsapp.svg" width="28" height="28" alt="" />
          </a>
          <a style={actionStyle} href="mailto:ella@fridgechannels.com" aria-label="Email FridgeChannel">
            <img src="/assets/contact/gmail.svg" width="28" height="28" alt="" />
          </a>
        </nav>
      )}
      <button
        type="button"
        style={buttonStyle}
        aria-label={isOpen ? 'Close contact options' : 'Contact FridgeChannel'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <img src="/assets/contact/contact.svg" width="25" height="25" alt="" style={{ filter: 'brightness(0) invert(1)' }} />
      </button>
    </div>
  )
}
