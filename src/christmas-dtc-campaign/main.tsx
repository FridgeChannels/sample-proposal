import { createRoot } from 'react-dom/client'
import { AnalyticsRoot } from '../analytics'
import { ChristmasDtcCampaign } from './App'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Christmas DTC campaign root element was not found.')
}

createRoot(root).render(
  <AnalyticsRoot page="sample" trackSectionDwell>
    <ChristmasDtcCampaign />
  </AnalyticsRoot>,
)
