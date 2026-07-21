import type { ViewKey } from '../types'

const items: Array<{ key: ViewKey; label: string; number: string }> = [
  { key: 'demo', label: 'Live Demo', number: '01' },
  { key: 'content', label: 'Sample Content', number: '02' },
  { key: 'order', label: 'Review Order', number: '03' },
]

export function TopNav({ active, onChange }: { active: ViewKey; onChange: (view: ViewKey) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Deal room navigation">
      {items.map((item) => (
        <button key={item.key} type="button" className={active === item.key ? 'is-active' : ''} onClick={() => onChange(item.key)} aria-current={active === item.key ? 'page' : undefined}>
          <small>{item.number}</small>{item.label}
        </button>
      ))}
    </nav>
  )
}
