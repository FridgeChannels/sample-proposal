import { createRoot } from 'react-dom/client'
import { AnalyticsRoot } from '../analytics'
import { ChristmasAsinCampaign } from './App'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Christmas ASIN campaign root element was not found.')
}

createRoot(root).render(
  <AnalyticsRoot page="sample" trackSectionDwell>
    <ChristmasAsinCampaign />
  </AnalyticsRoot>,
)
