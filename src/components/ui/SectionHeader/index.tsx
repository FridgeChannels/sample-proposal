import type { ReactNode } from 'react'
import '../tokens.css'
import './styles.css'

export type SectionHeaderProps = { eyebrow?: string; title: string; description?: string; action?: ReactNode; size?: 'large' | 'small' }

export function SectionHeader({ eyebrow, title, description, action, size = 'large' }: SectionHeaderProps) {
  return (
    <header className={`ui-section-header ui-section-header--${size}`}>
      <div>{eyebrow && <p className="ui-section-header__eyebrow">{eyebrow}</p>}<h2>{title}</h2>{description && <p className="ui-section-header__description">{description}</p>}</div>
      {action && <div className="ui-section-header__action">{action}</div>}
    </header>
  )
}
