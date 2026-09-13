import { useEffect, type ReactNode } from 'react'

export function Modal({ title, description, ariaLabel = 'Dialog', onClose, children }: { title?: string; description?: string; ariaLabel?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined} aria-label={title ? undefined : ariaLabel}>
        <div className={`modal-head ${title || description ? '' : 'is-minimal'}`}>
          {(title || description) && <div>{title && <h2 id="modal-title">{title}</h2>}{description && <p>{description}</p>}</div>}
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </section>
    </div>
  )
}
