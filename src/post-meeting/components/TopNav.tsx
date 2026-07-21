import { statusLabels } from '../config'
import type { OrderStatus, ViewKey } from '../types'

const items: Array<{ key: ViewKey; label: string; number: string }> = [
  { key: 'demo', label: 'Live Demo', number: '01' },
  { key: 'content', label: 'Sample Content', number: '02' },
  { key: 'order', label: 'Review Order', number: '03' },
]

export function TopNav({ active, orderStatus, onChange }: { active: ViewKey; orderStatus: OrderStatus; onChange: (view: ViewKey) => void }) {
  return (
    <header className="top-nav">
      <button className="brand-mark" type="button" onClick={() => onChange('demo')} aria-label="Open Live Demo">
        <span>FC</span><strong>FridgeChannel</strong>
      </button>
      <nav aria-label="Deal room navigation">
        {items.map((item) => (
          <button key={item.key} type="button" className={active === item.key ? 'is-active' : ''} onClick={() => onChange(item.key)} aria-current={active === item.key ? 'page' : undefined}>
            <small>{item.number}</small>{item.label}
          </button>
        ))}
      </nav>
      <div className="nav-status"><span /> {statusLabels[orderStatus]}</div>
    </header>
  )
}
