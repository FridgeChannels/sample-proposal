import { createRoot } from 'react-dom/client'
import { AnalyticsRoot } from '../analytics'
import { App } from './App'

createRoot(document.getElementById('post-meeting-root')!).render(
  <AnalyticsRoot page="live">
    <App />
  </AnalyticsRoot>,
)
