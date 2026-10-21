import type { ReactNode } from 'react'
import { Badge } from '../Badge'
import { Card } from '../Card'
import '../tokens.css'
import './styles.css'

export type MetricCardProps = {
  label: string
  value: string
  change?: string
  detail?: string
  tone?: 'plain' | 'lilac' | 'gold' | 'teal' | 'dark' | 'clay'
  icon?: ReactNode
}

export function MetricCard({ label, value, change, detail, tone = 'plain', icon }: MetricCardProps) {
  return (
    <Card tone={tone} className="ui-metric-card">
      <div className="ui-metric-card__top"><span>{label}</span>{icon && <span className="ui-metric-card__icon" aria-hidden="true">{icon}</span>}</div>
      <div className="ui-metric-card__value-row"><strong>{value}</strong>{change && <Badge tone={tone === 'dark' ? 'mint' : 'neutral'}>{change}</Badge>}</div>
      {detail && <p>{detail}</p>}
    </Card>
  )
}
