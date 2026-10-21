import { useEffect, useId, type ReactNode } from 'react'
import { IconButton } from '../IconButton'
import '../tokens.css'
import './styles.css'

export type ModalProps = {
  title?: string
  description?: string
  ariaLabel?: string
  onClose: () => void
  children: ReactNode
  variant?: 'default' | 'legacy'
}

export function Modal({ title, description, ariaLabel = 'Dialog', onClose, children, variant = 'default' }: ModalProps) {
  const titleId = useId()
  const legacy = variant === 'legacy'
  const backdropClass = legacy ? 'modal-backdrop' : 'ui-modal__backdrop'
  const panelClass = legacy ? 'modal-panel' : 'ui-modal__panel'
  const headerClass = legacy ? 'modal-head' : 'ui-modal__head'
  const closeClass = legacy ? 'icon-button' : ''

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className={backdropClass} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={panelClass} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : ariaLabel}>
        <div className={`${headerClass}${title || description ? '' : legacy ? ' is-minimal' : ' ui-modal__head--minimal'}`}>
          {(title || description) && <div>{title && <h2 id={titleId}>{title}</h2>}{description && <p>{description}</p>}</div>}
          <IconButton className={closeClass} label="Close" onClick={onClose} tone="plain" unstyled={legacy}>×</IconButton>
        </div>
        {children}
      </section>
    </div>
  )
}
