import { useState } from 'react'
import {
  AvatarStack,
  Badge,
  BrandMark,
  Button,
  Card,
  DealRoomNav,
  IconButton,
  IconNav,
  MetricCard,
  Modal,
  SectionHeader,
  Tabs,
  TextField,
  TrendChart,
} from '../components/ui'

const componentSpecs = [
  {
    id: 'button', number: '01', name: 'Button', note: 'Actions, clear and considered.',
    props: 'variant · size · startIcon · endIcon · disabled',
    access: 'Native button semantics; visible keyboard focus.',
  },
  {
    id: 'badge', number: '02', name: 'Badge', note: 'Short labels and state.',
    props: 'tone · children',
    access: 'Use concise text; do not rely on color alone.',
  },
  {
    id: 'card', number: '03', name: 'Card', note: 'A flexible container with tonal options.',
    props: 'tone · className · children',
    access: 'Uses an article landmark for self-contained content.',
  },
  {
    id: 'text-field', number: '04', name: 'Text field', note: 'Label, hint, and validation states.',
    props: 'label · hint · error · native input props',
    access: 'Visible label and hint/error association with aria-describedby.',
  },
  {
    id: 'metric-card', number: '05', name: 'Metric card', note: 'A number with enough context to act.',
    props: 'label · value · change · detail · tone · icon',
    access: 'Keep the metric label and unit explicit.',
  },
  {
    id: 'brand-mark', number: '06', name: 'Brand mark', note: 'A flexible brand lockup and symbol.',
    props: 'name · initials · tone · compact',
    access: 'The lockup exposes the brand name as its accessible label.',
  },
  {
    id: 'avatar-stack', number: '07', name: 'Avatar stack', note: 'Show a small group without taking over.',
    props: 'names · max · label',
    access: 'Group has one descriptive accessible name.',
  },
  {
    id: 'icon-button', number: '08', name: 'Icon button', note: 'Compact actions with accessible names.',
    props: 'label · tone · disabled · children',
    access: 'Requires a descriptive label and supports keyboard focus.',
  },
  {
    id: 'tabs', number: '09', name: 'Tabs', note: 'Move between related views.',
    props: 'items · activeId · onChange · ariaLabel',
    access: 'Tablist and selected state are exposed with ARIA roles.',
  },
  {
    id: 'icon-nav', number: '10', name: 'Icon navigation', note: 'A compact way to switch destinations.',
    props: 'items · active · onChange · ariaLabel',
    access: 'Each destination has a text label and current-page state.',
  },
  {
    id: 'deal-room-nav', number: '11', name: 'Deal room nav', note: 'Shared navigation used by both deal room pages.',
    props: 'active · onChange · legacy',
    access: 'Uses the same labeled, current-page navigation pattern.',
  },
  {
    id: 'trend-chart', number: '12', name: 'Trend chart', note: 'A lightweight visual for change over time.',
    props: 'data · compareData · label · height',
    access: 'Summarizes the series in an accessible chart label.',
  },
  {
    id: 'modal', number: '13', name: 'Modal', note: 'A focused layer for a clear next step.',
    props: 'title · description · ariaLabel · onClose · variant',
    access: 'Dialog semantics; closes with Escape or backdrop click.',
  },
  {
    id: 'section-header', number: '14', name: 'Section header', note: 'A consistent start for every content block.',
    props: 'eyebrow · title · description · action · size',
    access: 'Provides a heading and optional supporting copy.',
  },
] as const

const navItems = [
  { id: 'live', label: 'Live view', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 9 6-9 6V6Z" /></svg> },
  { id: 'insights', label: 'Insights', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18V9m5 9V5m5 13v-6m5 6V3" /></svg> },
  { id: 'portfolio', label: 'Portfolio', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h4" /></svg> },
]

const colors = [
  { name: 'Black', token: '--ui-ink', value: '#050505', tone: 'dark' },
  { name: 'Paper', token: '--ui-paper', value: '#F7F7F6', tone: 'paper' },
  { name: 'Mist', token: '--ui-mist', value: '#EBEBEB', tone: 'mist' },
  { name: 'Lilac', token: '--ui-lilac', value: '#BEB8F4', tone: 'lilac' },
  { name: 'Sand', token: '--ui-gold', value: '#D0BB80', tone: 'gold' },
  { name: 'Tidal', token: '--ui-teal', value: '#79B7C0', tone: 'teal' },
  { name: 'Mint', token: '--ui-mint', value: '#91DCB8', tone: 'mint' },
  { name: 'Clay', token: '--ui-clay', value: '#BEA17F', tone: 'clay' },
  { name: 'Coral', token: '--ui-coral', value: '#E29B74', tone: 'coral' },
  { name: 'Lemon', token: '--ui-lemon', value: '#EFED55', tone: 'lemon' },
]

export function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [activeNav, setActiveNav] = useState('live')
  const [activeDealRoomView, setActiveDealRoomView] = useState('demo')
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="playground-shell">
      <aside className="pg-sidebar">
        <a href="#overview" className="pg-logo"><BrandMark name="Studio" initials="S" compact /><span>Interface<br />system</span></a>
        <div className="pg-sidebar-label">Explore</div>
        <nav className="pg-side-nav" aria-label="Playground sections">
          <a href="#overview" className="is-current"><span>00</span>Overview</a>
          <a href="#tokens"><span>01</span>Design tokens</a>
          <a href="#type"><span>02</span>Typography</a>
          <a href="#components"><span>03</span>Components</a>
        </nav>
        <div className="pg-sidebar-bottom"><span className="pg-status-dot" /> System library <small>Reference edition · 14 components</small></div>
      </aside>

      <main className="pg-main">
        <div className="pg-topbar"><span>REFERENCE / FOUNDATIONS / COMPONENTS</span><span>STYLE GUIDE · 01—14</span></div>

        <section id="overview" className="pg-hero">
          <div className="pg-hero-copy">
            <Badge tone="lilac">A shared visual language</Badge>
            <h1>Less noise.<br /><em>More signal.</em></h1>
            <p>An interface library shaped by the editorial brand cards, confident numbers, and minimalist dashboards in the supplied references.</p>
            <a className="pg-text-link" href="#components">Explore components <span>↘</span></a>
          </div>
          <div className="pg-hero-art" aria-hidden="true">
            <div className="pg-art-top"><BrandMark name="Venture" tone="lilac" /><span>VISUAL STUDY<br />01—14</span></div>
            <div className="pg-art-title">A clearer<br />way forward<span>.</span></div>
            <div className="pg-art-circles"><i /><i /><i /></div>
            <div className="pg-art-rule" />
            <div className="pg-art-bottom"><strong>14</strong><span>reusable<br />components</span><span className="pg-art-arrow">↗</span></div>
          </div>
        </section>

        <section className="pg-overview-strip" aria-label="System principles">
          <div><span>01</span><strong>One source of truth</strong><p>Tokens keep color, shape, and rhythm consistent.</p></div>
          <div><span>02</span><strong>Small, reusable parts</strong><p>Each component has one focused job.</p></div>
          <div><span>03</span><strong>Ready to compose</strong><p>Accessible building blocks for every page.</p></div>
        </section>

        <section id="tokens" className="pg-section">
          <SectionHeader eyebrow="01 / Foundations" title="Design tokens" description="A compact palette and a steady rhythm make each brand surface feel connected." />
          <div className="pg-token-grid">
            <Card className="pg-palette-card">
              <div className="pg-card-heading"><div><span className="pg-kicker">COLOR / REFERENCE</span><h3>Core palette</h3></div><span className="pg-count">10</span></div>
              <div className="pg-swatches">{colors.map((color) => <div className="pg-swatch" key={color.name}><span className={`pg-swatch-color is-${color.tone}`} /><span>{color.name}</span><small>{color.token}</small><small>{color.value}</small></div>)}</div>
            </Card>
            <Card tone="dark" className="pg-rhythm-card">
              <span className="pg-kicker">SPACING / 8PT GRID</span><h3>Room to<br />breathe.</h3>
              <div className="pg-spacing-list">{[4, 8, 16, 24, 32, 48].map((size) => <div key={size}><span>{String(size).padStart(2, '0')}</span><i style={{ width: `${size * 2.3}px` }} /></div>)}</div>
            </Card>
          </div>
          <div className="pg-token-footnotes">
            <div><span>RADIUS</span><strong>--ui-radius-sm 12px · md 22px · lg 32px · pill</strong></div>
            <div><span>SHADOW</span><strong>--ui-shadow-soft · subtle elevation</strong></div>
            <div><span>TYPE PAIR</span><strong>--ui-font-serif · --ui-font-sans</strong></div>
          </div>
        </section>

        <section id="type" className="pg-section pg-type-section">
          <SectionHeader eyebrow="02 / Type" title="A clear voice." description="Editorial display typography gives the system character; a crisp sans keeps controls and data easy to scan." size="small" />
          <div className="pg-type-specimen">
            <div><span className="pg-kicker">DISPLAY / SERIF</span><p className="pg-display-sample">Make every<br />signal visible.</p></div>
            <div><span className="pg-kicker">INTERFACE / SANS</span><p className="pg-sans-sample">Thoughtful tools for the everyday. Data with a human point of view.</p><small>Regular 16 / Medium 14 / Label 11</small></div>
            <span className="pg-type-index">Aa</span>
          </div>
        </section>

        <section id="components" className="pg-section pg-component-section">
          <SectionHeader eyebrow="03 / Library" title="Every piece, in one place." description="Browse the shared components below. Each preview uses the same production component exported from the UI library." />
          <div className="pg-component-index"><span>COMPONENT INDEX</span><div>{componentSpecs.map(({ id, name }, index) => <a key={id} href={`#${id}`}><span>{String(index + 1).padStart(2, '0')}</span>{name}<b>↘</b></a>)}</div></div>

          <div className="pg-component-grid">
            <Card id="button" className="pg-component-card pg-span-2">
              <ComponentHeading id="button" />
              <div className="pg-button-row"><Button>Primary action <span>↗</span></Button><Button variant="secondary">Secondary</Button><Button variant="outline">Explore</Button><Button variant="ghost" endIcon={<span>→</span>}>Text action</Button></div>
            </Card>

            <Card id="badge" className="pg-component-card">
              <ComponentHeading id="badge" />
              <div className="pg-badge-row"><Badge>Available</Badge><Badge tone="gold">Growth</Badge><Badge tone="lilac">Investment</Badge><Badge tone="teal">Live</Badge><Badge tone="coral">+9.2%</Badge></div>
            </Card>

            <Card id="card" className="pg-component-card">
              <ComponentHeading id="card" />
              <div className="pg-card-variants"><Card tone="mist">Soft gray</Card><Card tone="lilac">Lavender</Card><Card tone="clay">Warm clay</Card><Card tone="dark">Deep teal</Card></div>
            </Card>

            <Card id="text-field" className="pg-component-card">
              <ComponentHeading id="text-field" />
              <div className="pg-field-stack"><TextField label="Work email" type="email" placeholder="you@company.com" hint="We’ll only use this for your account." /><TextField label="Campaign name" defaultValue="Growth launch" error="This name is already in use." /></div>
            </Card>

            <Card id="metric-card" className="pg-component-card">
              <ComponentHeading id="metric-card" />
              <div className="pg-metric-grid"><MetricCard label="Global reach" value="1.4B" change="↑ 9.2%" detail="Funded brand · globally" tone="lilac" /><MetricCard label="Monthly growth" value="$42.8K" change="↑ 3.2%" detail="Growth last month" tone="gold" /></div>
            </Card>

            <Card id="brand-mark" className="pg-component-card">
              <ComponentHeading id="brand-mark" />
              <div className="pg-brand-row"><BrandMark name="Venture" /><BrandMark name="Dstudio" tone="lilac" /><BrandMark name="Pay-Wisely" tone="gold" /><BrandMark name="Venture" compact /></div>
            </Card>

            <Card id="avatar-stack" className="pg-component-card">
              <ComponentHeading id="avatar-stack" />
              <div className="pg-avatar-demo"><AvatarStack names={['Maya Chen', 'Theo Park', 'Amira James', 'Noah Gray', 'Sofia Rivera']} /><span>5 portfolio advisors</span></div>
            </Card>

            <Card id="icon-button" className="pg-component-card">
              <ComponentHeading id="icon-button" />
              <div className="pg-icon-row"><IconButton label="Open details"><span>↗</span></IconButton><IconButton label="Next item" tone="dark"><span>→</span></IconButton><IconButton label="Close preview"><span>×</span></IconButton></div>
            </Card>

            <Card id="tabs" className="pg-component-card">
              <ComponentHeading id="tabs" />
              <Tabs items={[{ id: 'overview', label: 'Overview' }, { id: 'activity', label: 'Activity', badge: '4' }, { id: 'settings', label: 'Settings' }]} activeId={activeTab} onChange={setActiveTab} />
              <p className="pg-interaction-note">Showing <strong>{activeTab}</strong> view</p>
            </Card>

            <Card id="icon-nav" className="pg-component-card">
              <ComponentHeading id="icon-nav" />
              <IconNav items={navItems} active={activeNav} onChange={setActiveNav} ariaLabel="Preview navigation" />
            </Card>

            <Card id="deal-room-nav" className="pg-component-card">
              <ComponentHeading id="deal-room-nav" />
              <DealRoomNav active={activeDealRoomView} onChange={setActiveDealRoomView} />
            </Card>

            <Card id="trend-chart" className="pg-component-card pg-span-2">
              <ComponentHeading id="trend-chart" />
              <div className="pg-chart-frame"><div className="pg-chart-summary"><span>Portfolio growth</span><strong>+32%</strong><small>last 12 months <Badge tone="mint">On track</Badge></small></div><TrendChart label="Portfolio growth over the last 12 months" data={[12, 18, 16, 27, 24, 32, 29, 46, 42, 57, 54, 72]} compareData={[18, 22, 19, 21, 28, 24, 34, 35, 37, 40, 42, 48]} /></div>
            </Card>

            <Card id="modal" className="pg-component-card">
              <ComponentHeading id="modal" />
              <div className="pg-modal-preview"><div><span className="pg-modal-dot" /><strong>One decision at a time.</strong><small>Dialog with backdrop, close, and escape interactions.</small></div><Button variant="outline" onClick={() => setModalOpen(true)}>Open modal <span>↗</span></Button></div>
            </Card>

            <Card id="section-header" className="pg-component-card">
              <ComponentHeading id="section-header" />
              <div className="pg-header-preview"><SectionHeader size="small" eyebrow="INSIGHTS / 01" title="Full-funnel signals" description="See the patterns that move your portfolio forward." /></div>
            </Card>
          </div>
        </section>

        <footer className="pg-footer"><BrandMark name="Reference-led UI" /><span>Editorial type · data-forward layouts · soft brand color.</span><a href="#overview">Back to top ↑</a></footer>
      </main>

      {modalOpen && <Modal title="Start with a signal" description="Keep the next step focused. Add a few details and we’ll take it from there." onClose={() => setModalOpen(false)}>
        <div className="pg-modal-content"><TextField label="Your email" type="email" placeholder="name@company.com" /><Button size="lg" onClick={() => setModalOpen(false)}>Continue <span>→</span></Button></div>
      </Modal>}
    </div>
  )
}

function ComponentHeading({ id }: { id: string }) {
  const spec = componentSpecs.find((component) => component.id === id)
  if (!spec) return null
  return <div className="pg-component-heading"><span>{spec.number} / UI</span><div><h3>{spec.name}</h3><p>{spec.note}</p><details className="pg-spec"><summary>Component spec</summary><p><strong>Props</strong> {spec.props}</p><p><strong>Accessibility</strong> {spec.access}</p></details></div><span className="pg-component-link" aria-hidden="true">↗</span></div>
}
