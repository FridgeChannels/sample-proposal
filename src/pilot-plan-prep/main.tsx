import { createRoot } from 'react-dom/client'
import { PilotPlanPrep } from './App'

const root = document.getElementById('root')
if (!root) throw new Error('Pilot Plan prep root element was not found.')
createRoot(root).render(<PilotPlanPrep />)
