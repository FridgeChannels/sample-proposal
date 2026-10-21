import type { ViewKey } from '../types'
import { DealRoomNav, type DealRoomNavView } from '../../components/ui/DealRoomNav'

export function TopNav({ active, onChange }: { active: ViewKey; onChange: (view: ViewKey) => void }) {
  return <DealRoomNav active={active} onChange={(view: DealRoomNavView) => onChange(view)} legacy />
}
