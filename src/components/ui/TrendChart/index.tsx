import '../tokens.css'
import './styles.css'

export type TrendChartProps = { data: number[]; compareData?: number[]; label?: string; height?: number }

function pointsFor(data: number[], width: number, height: number) {
  if (!data.length) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 10
  return data.map((value, index) => {
    const x = pad + (data.length === 1 ? 0 : index * (width - pad * 2) / (data.length - 1))
    const y = height - pad - ((value - min) / range) * (height - pad * 2)
    return `${x},${y}`
  }).join(' ')
}

function barsFor(data: number[], width: number, height: number) {
  if (!data.length) return []
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 10
  return data.map((value, index) => {
    const x = pad + (data.length === 1 ? 0 : index * (width - pad * 2) / (data.length - 1))
    const y = height - pad - ((value - min) / range) * (height - pad * 2)
    return { x, y }
  })
}

export function TrendChart({ data, compareData, label = 'Performance trend', height = 140 }: TrendChartProps) {
  const width = 360
  return (
    <div className="ui-trend-chart" role="img" aria-label={`${label}: ${data.length} data points`}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <g className="ui-trend-chart__bars">{barsFor(data, width, height).map(({ x, y }, index) => <line key={index} x1={x} x2={x} y1={height - 10} y2={y} />)}</g>
        {compareData?.length ? <polyline className="ui-trend-chart__compare" points={pointsFor(compareData, width, height)} /> : null}
        {data.length > 0 && <polyline className="ui-trend-chart__line" points={pointsFor(data, width, height)} />}
      </svg>
      <div className="ui-trend-chart__axis"><span>JAN</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span><span>NOW</span></div>
    </div>
  )
}
