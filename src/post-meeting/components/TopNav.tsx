import type { ViewKey } from '../types'

const items: Array<{ key: ViewKey; label: string; number: string }> = [
  { key: 'demo', label: 'Live Demo', number: '01' },
  { key: 'content', label: 'Sample Content', number: '02' },
  { key: 'order', label: 'Review Order', number: '03' },
]

const NavIcon = ({ view }: { view: ViewKey }) => {
  if (view === 'demo') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 7 7 5-7 5V7Z" /></svg>
  if (view === 'content') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="1.5" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="12" height="15" rx="1.5" /><path d="M9 3h6M9 11h6M9 15h4" /></svg>
}

export function TopNav({ active, onChange }: { active: ViewKey; onChange: (view: ViewKey) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Deal room navigation">
      {items.map((item) => (
        <button key={item.key} type="button" className={active === item.key ? 'is-active' : ''} onClick={() => onChange(item.key)} aria-label={item.label} aria-current={active === item.key ? 'page' : undefined}>
          <NavIcon view={item.key} /><span className="sr-only">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
