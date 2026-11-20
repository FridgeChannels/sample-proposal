import './cpm-comparison.css'
import { PlatformLogo } from './platform-logos'

const SCALE_MAX = 10

const rows = [
  { name: 'HOMMIO — 4-person household', value: 0.21, hommio: true, logos: [] },
  { name: 'TikTok', value: 4.09, hommio: false, logos: ['tiktok'] },
  { name: 'Pinterest', value: 4.74, hommio: false, logos: ['pinterest'] },
  { name: 'YouTube', value: 7.05, hommio: false, logos: ['youtube'] },
  { name: 'Facebook / Instagram', value: 8.32, hommio: false, logos: ['facebook', 'instagram'] },
  { name: 'Snapchat', value: 8.78, hommio: false, logos: ['snapchat'] },
] as const

const ticks = [0, 2, 4, 6, 8, 10]

function money(value: number) {
  return `$${value.toFixed(2)}`
}

export function CpmComparison() {
  return (
    <div className="sheet">
      <header className="sheet-header">
        <h1>CPM COMPARISON</h1>
        <p className="lede">
          Four-person HOMMIO household over two years vs. U.S. social media advertising benchmarks
        </p>
        <p className="unit">COST PER 1,000 IMPRESSIONS / EXPOSURE OPPORTUNITIES | USD</p>
      </header>

      <figure className="chart">
        <div className="plot">
          <div className="grid" aria-hidden="true">
            {ticks.map((tick) => (
              <span key={tick} className={tick === 0 ? 'gridline is-origin' : 'gridline'} style={{ left: `${(tick / SCALE_MAX) * 100}%` }} />
            ))}
          </div>
          <ol className="rows">
            {rows.map((row) => (
              <li key={row.name} className={row.hommio ? 'is-hommio' : undefined}>
                <span className="name">
                  {row.hommio ? (
                    row.name
                  ) : (
                    <span className="logos">
                      <span className="sr-only">{row.name}</span>
                      {row.logos.map((logo) => (
                        <PlatformLogo key={logo} name={logo} />
                      ))}
                    </span>
                  )}
                </span>
                <span
                  className="lane"
                  style={{
                    ['--share' as string]: String(row.value / SCALE_MAX),
                    ['--dur' as string]: `${Math.round((row.value / SCALE_MAX) * 3200)}ms`,
                  }}
                >
                  <span className="bar" />
                  <span className="value">{money(row.value)}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="axis">
          <span className="axis-spacer" />
          <div className="axis-scale">
            {ticks.map((tick) => (
              <span key={tick} style={{ left: `${(tick / SCALE_MAX) * 100}%` }}>{tick}</span>
            ))}
          </div>
        </div>
        <p className="axis-label">CPM (USD)</p>
      </figure>

      <section className="model">
        <h2>HOMMIO MODEL</h2>
        <p>$6 Spot cost | 4 people | 40 modeled exposures per day | 2-year presence</p>
      </section>

      <footer className="notes">
        <p>Social media benchmarks: Gupta Media, 2025 Social Media CPM Tracker.</p>
        <p className="caveat">HOMMIO is a modeled potential in-home exposure CPM, not an independently verified viewable-impression measure.</p>
      </footer>
    </div>
  )
}
