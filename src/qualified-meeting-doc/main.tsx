import { createRoot } from 'react-dom/client'
import { QualifiedMeetingDoc } from './App'

const root = document.getElementById('root')

if (!root) {
  throw new Error('QualifiedMeetingDoc root element was not found.')
}

createRoot(root).render(<QualifiedMeetingDoc />)
