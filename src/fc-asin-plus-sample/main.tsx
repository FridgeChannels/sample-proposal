import { createRoot } from 'react-dom/client'
import { FcAsinPlusSample } from './App'

const root = document.getElementById('root')

if (!root) {
  throw new Error('FC-ASIN Plus Sample root element was not found.')
}

createRoot(root).render(<FcAsinPlusSample />)
