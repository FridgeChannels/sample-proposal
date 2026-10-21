import type { ReactNode } from 'react'
import '../tokens.css'
import './styles.css'

export type IconNavItem<T extends string> = { id: T; label: string; icon: ReactNode }
export type IconNavProps<T extends string> = { items: IconNavItem<T>[]; active: T; onChange: (id: T) => void; ariaLabel?: string; legacy?: boolean }

export function IconNav<T extends string>({ items, active, onChange, ariaLabel = 'Primary navigation', legacy = false }: IconNavProps<T>) {
  const className = legacy ? 'bottom-nav' : 'ui-icon-nav'
  return (
    <nav className={className} aria-label={ariaLabel}>
      {items.map((item) => <button key={item.id} type="button" className={active === item.id ? 'is-active' : ''} onClick={() => onChange(item.id)} aria-label={item.label} aria-current={active === item.id ? 'page' : undefined}>{item.icon}<span className={legacy ? 'sr-only' : 'ui-icon-nav__label'}>{item.label}</span></button>)}
    </nav>
  )
}
