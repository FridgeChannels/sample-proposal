import '../tokens.css'
import './styles.css'

export type TabItem = { id: string; label: string; badge?: string }
export type TabsProps = { items: TabItem[]; activeId: string; onChange: (id: string) => void; ariaLabel?: string }

export function Tabs({ items, activeId, onChange, ariaLabel = 'View options' }: TabsProps) {
  return (
    <div className="ui-tabs" role="tablist" aria-label={ariaLabel}>
      {items.map((item) => <button className={`ui-tabs__tab${activeId === item.id ? ' is-active' : ''}`} type="button" role="tab" aria-selected={activeId === item.id} key={item.id} onClick={() => onChange(item.id)}>{item.label}{item.badge && <span>{item.badge}</span>}</button>)}
    </div>
  )
}
