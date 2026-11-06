import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react'

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

const inlineFabStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1200,
  display: 'grid',
  justifyItems: 'center',
  gap: 10,
  width: 52,
  transition: 'none',
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
  background: '#f15b2a',
  boxShadow: '0 8px 20px rgba(241, 91, 42, 0.32)',
  cursor: 'pointer',
}

const inlineButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: 'var(--leg-brand)',
  boxShadow: '0 6px 16px rgba(23, 56, 43, 0.18)',
}

const copiedStyle: CSSProperties = {
  position: 'absolute',
  right: 'calc(100% + 12px)',
  bottom: 10,
  padding: '8px 12px',
  borderRadius: 999,
  background: '#fff',
  color: '#171717',
  boxShadow: '0 6px 16px rgba(18, 31, 27, 0.16)',
  font: '600 13px/1.2 Arial, sans-serif',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
}

const inlineCopiedStyle: CSSProperties = {
  ...copiedStyle,
  right: '50%',
  bottom: 'calc(100% + 8px)',
  transform: 'translateX(50%)',
}

const contactMethods = [
  { label: 'SMS', href: 'sms:+19729000833', value: '+1 972-900-0833', icon: 'sms.svg', ariaLabel: 'Send an SMS to FridgeChannel' },
  { label: 'WhatsApp', href: 'https://wa.me/19729000833', value: '+1 972-900-0833', icon: 'whatsapp.svg', ariaLabel: 'Message FridgeChannel on WhatsApp' },
  { label: 'Email', href: 'mailto:billy@fridgechannels.com', value: 'billy@fridgechannels.com', icon: 'gmail.svg', ariaLabel: 'Email FridgeChannel' },
]

async function copyToClipboard(value: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return
    }
  } catch {
    // Fall back to a temporary input for browsers that reject clipboard access.
  }

  const input = document.createElement('textarea')
  input.value = value
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  const copied = document.execCommand('copy')
  input.remove()

  if (!copied) throw new Error('Clipboard copy failed')
}

/** Persistent, low-friction contact entry shared by the DTC and About pages. */
export function FloatingContactButton({ placement = 'floating' }: { placement?: 'floating' | 'inline' } = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const copyFeedbackTimeoutRef = useRef<number | undefined>(undefined)

  const handleContactClick = async (event: ReactMouseEvent<HTMLAnchorElement>, value: string) => {
    const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (!isDesktop) return

    event.preventDefault()
    try {
      await copyToClipboard(value)
      setCopyFeedback('Copied')
    } catch {
      setCopyFeedback('Copy failed')
    }

    window.clearTimeout(copyFeedbackTimeoutRef.current)
    copyFeedbackTimeoutRef.current = window.setTimeout(() => setCopyFeedback(''), 1800)
  }

  const rootStyle = placement === 'inline'
    ? inlineFabStyle
    : { ...fabStyle, ...(isOpen ? openFabStyle : {}) }

  useEffect(() => {
    if (!isOpen) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    // A document click covers mouse clicks on desktop and taps on mobile.
    document.addEventListener('click', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('click', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  useEffect(() => () => window.clearTimeout(copyFeedbackTimeoutRef.current), [])

  return (
    <div ref={rootRef} className={`floating-contact-button${placement === 'inline' ? ' is-inline' : ''}`} style={rootStyle}>
      {isOpen && (
        <nav style={{ display: 'grid', gap: 10, width: 'max-content', margin: 0 }} aria-label="Contact FridgeChannel directly">
          {contactMethods.map((method) => (
            <a
              key={method.label}
              style={actionStyle}
              href={method.href}
              aria-label={method.ariaLabel}
              onClick={(event) => void handleContactClick(event, method.value)}
            >
              <img src={`/assets/contact/${method.icon}`} width="28" height="28" alt="" />
            </a>
          ))}
        </nav>
      )}
      {copyFeedback && <span style={placement === 'inline' ? inlineCopiedStyle : copiedStyle} role="status" aria-live="polite">{copyFeedback}</span>}
      <button
        type="button"
        style={placement === 'inline' ? inlineButtonStyle : buttonStyle}
        aria-label={isOpen ? 'Close contact options' : 'Contact FridgeChannel'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <img src="/assets/contact/contact.svg" width="25" height="25" alt="" style={{ filter: 'brightness(0) invert(1)' }} />
      </button>
    </div>
  )
}
