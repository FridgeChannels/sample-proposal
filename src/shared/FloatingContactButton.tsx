import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react'
import { motion } from 'framer-motion'

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

const navFabStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1200,
  display: 'grid',
  justifyItems: 'center',
  width: 'max-content',
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

const inlineContactMenuStyle: CSSProperties = {
  position: 'absolute',
  right: 0,
  bottom: 'calc(100% + 10px)',
  zIndex: 1201,
  display: 'grid',
  gap: 10,
  width: 'max-content',
  margin: 0,
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
export function FloatingContactButton({
  placement = 'floating',
  open,
  onOpenChange,
}: {
  placement?: 'floating' | 'inline' | 'nav' | 'page'
  open?: boolean
  onOpenChange?: (open: boolean) => void
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open ?? internalOpen
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

  const rootStyle = placement === 'page'
    ? undefined
    : placement === 'nav'
    ? navFabStyle
    : placement === 'inline'
      ? inlineFabStyle
      : { ...fabStyle, ...(isOpen ? openFabStyle : {}) }

  useEffect(() => {
    if (!isOpen) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setInternalOpen(false)
        onOpenChange?.(false)
      }
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setInternalOpen(false)
        onOpenChange?.(false)
      }
    }

    // A document click covers mouse clicks on desktop and taps on mobile.
    document.addEventListener('click', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('click', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen, onOpenChange])

  useEffect(() => () => window.clearTimeout(copyFeedbackTimeoutRef.current), [])

  return (
    <div ref={rootRef} className={`floating-contact-button${placement === 'inline' ? ' is-inline' : ''}${placement === 'nav' ? ' is-nav' : ''}${placement === 'page' ? ' is-page' : ''}`} style={rootStyle}>
      {(isOpen || placement === 'page') && (
        <nav className={placement === 'page' ? 'contact-hommio-methods' : undefined} style={placement === 'page' ? undefined : placement === 'floating' ? { display: 'grid', gap: 10, width: 'max-content', margin: 0 } : inlineContactMenuStyle} aria-label={placement === 'page' ? 'Contact Hommio directly' : 'Contact FridgeChannel directly'}>
          {contactMethods.map((method) => (
            <a
              key={method.label}
              className={placement === 'page' ? 'contact-hommio-method' : undefined}
              style={placement === 'page' ? undefined : actionStyle}
              href={method.href}
              aria-label={placement === 'page' ? `Contact Hommio via ${method.label}` : method.ariaLabel}
              onClick={(event) => void handleContactClick(event, method.value)}
            >
              {placement === 'page' ? (
                <>
                  <span className="contact-hommio-method-icon"><img src={`/assets/contact/${method.icon}`} width="34" height="34" alt="" /></span>
                  <span className="contact-hommio-method-label">{method.label}</span>
                </>
              ) : (
                <img src={`/assets/contact/${method.icon}`} width="28" height="28" alt="" />
              )}
            </a>
          ))}
        </nav>
      )}
      {copyFeedback && <span className={placement === 'page' ? 'contact-hommio-feedback' : undefined} style={placement === 'page' ? undefined : placement === 'floating' ? copiedStyle : inlineCopiedStyle} role="status" aria-live="polite">{copyFeedback}</span>}
      {placement !== 'page' && <motion.button
        type="button"
        whileTap={placement === 'nav' ? { scale: 0.97 } : undefined}
        className={placement === 'nav' ? `bottom-nav-button${isOpen ? ' is-active' : ''}` : undefined}
        style={placement === 'nav' ? undefined : placement === 'inline' ? inlineButtonStyle : buttonStyle}
        aria-label={placement === 'nav' ? 'Contact Hommio' : isOpen ? 'Close contact options' : 'Contact FridgeChannel'}
        aria-expanded={isOpen}
        onClick={() => {
          setInternalOpen(!isOpen)
          onOpenChange?.(!isOpen)
        }}
      >
        <img src="/assets/contact/contact.svg" width={placement === 'nav' ? 22 : 25} height={placement === 'nav' ? 22 : 25} alt="" className={placement === 'nav' ? 'bottom-nav-icon' : undefined} style={placement === 'nav' ? undefined : { filter: 'brightness(0) invert(1)' }} />
        {placement === 'nav' && <span className="bottom-nav-label" aria-hidden={!isOpen}>Contact Hommio</span>}
      </motion.button>}
    </div>
  )
}
