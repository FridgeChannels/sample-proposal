import { createRoot } from 'react-dom/client'
import { PilotPlan } from './App'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Pilot Plan root element was not found.')
}

createRoot(root).render(<PilotPlan />)
