import { createRoot } from 'react-dom/client'
import { AnalyticsRoot } from '../analytics'
import { App } from './App'
import '../components/ui/tokens.css'

createRoot(document.getElementById('root')!).render(
  <AnalyticsRoot page="investor" sessionReplay>
    <App />
  </AnalyticsRoot>,
)
