import { createRoot } from 'react-dom/client'
import { FitMeetingSample } from './App'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Fit Meeting Sample root element was not found.')
}

createRoot(root).render(<FitMeetingSample />)
