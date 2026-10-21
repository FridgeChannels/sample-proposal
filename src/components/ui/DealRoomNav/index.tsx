import { IconNav, type IconNavItem } from '../IconNav'

export type DealRoomNavView = 'demo' | 'content' | 'order'

const items: IconNavItem<DealRoomNavView>[] = [
  { id: 'demo', label: 'Live Demo', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 7 7 5-7 5V7Z" /></svg> },
  { id: 'content', label: 'Sample Content', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="1.5" /><path d="M8 9h8M8 13h8M8 17h5" /></svg> },
  { id: 'order', label: 'Review Order', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="12" height="15" rx="1.5" /><path d="M9 3h6M9 11h6M9 15h4" /></svg> },
]

export function DealRoomNav({ active, onChange, legacy = false }: { active: string; onChange: (view: DealRoomNavView) => void; legacy?: boolean }) {
  return <IconNav items={items} active={active as DealRoomNavView} onChange={onChange} ariaLabel="Deal room navigation" legacy={legacy} />
}
