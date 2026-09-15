import type { CSSProperties } from 'react'

const buttonStyle: CSSProperties = {
  position: 'fixed',
  top: 'max(12px, env(safe-area-inset-top, 0px))',
  left: 'max(12px, env(safe-area-inset-left, 0px))',
  zIndex: 1200,
  display: 'grid',
  placeItems: 'center',
  width: 44,
  height: 44,
  margin: 0,
  padding: 0,
  border: '1px solid rgba(255, 255, 255, 0.28)',
  borderRadius: 999,
  background: 'rgba(12, 12, 12, 0.42)',
  color: '#fff',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  cursor: 'pointer',
}

function snFromSearch(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get('sn') || params.get('id') || null
}

function goBackToPreviousPage() {
  const sn = snFromSearch()
  if (window.history.length > 1) {
    window.history.back()
    return
  }
  if (sn) {
    window.location.assign(`/p/${encodeURIComponent(sn)}#demo`)
    return
  }
  window.history.back()
}

export function FloatingBackButton({ label = 'Go back' }: { label?: string }) {
  return (
    <button type="button" style={buttonStyle} onClick={goBackToPreviousPage} aria-label={label}>
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M15 6L9 12l6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
