import { createRoot } from 'react-dom/client'
import './styles.css'
import { PilotPlan } from './App'

const root = document.getElementById('root')

if (!root) throw new Error('GardenCup proposal root was not found.')

createRoot(root).render(<PilotPlan />)
