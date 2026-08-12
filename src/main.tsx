import { createRoot } from 'react-dom/client'
import { AnalyticsRoot } from './analytics'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <AnalyticsRoot page="sample" trackSectionDwell>
    <App />
  </AnalyticsRoot>,
)
