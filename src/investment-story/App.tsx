import { useLayoutEffect, type ReactNode } from 'react'
import { BrandMark } from '../components/ui/BrandMark'
import './styles.css'

const chapters = [
  ['00', 'story-intro', 'Investment story'],
  ['01', 'slide-1', 'FridgeChannel'],
  ['02', 'slide-2', 'The problem'],
  ['03', 'slide-3', 'The solution'],
  ['04', 'slide-4', 'How it works'],
  ['05', 'slide-5', 'Business model'],
  ['06', 'slide-6', 'Revenue potential'],
  ['07', 'slide-7', 'Go to market'],
  ['08', 'slide-8', '24-month ambition'],
  ['09', 'slide-9', 'Investment partners'],
]

const sampleInterviewedBrands = [
  { cohort: 'SuperZoo 2026', brands: ['Example Brand 001', 'Example Brand 002', 'Example Brand 003', 'Example Brand 004', 'Example Brand 005', 'Example Brand 006'] },
  { cohort: 'Newtopia Now 2026', brands: ['Example Brand 007', 'Example Brand 008', 'Example Brand 009', 'Example Brand 010', 'Example Brand 011', 'Example Brand 012'] },
  { cohort: 'NACS Show 2026', brands: ['Example Brand 013', 'Example Brand 014', 'Example Brand 015', 'Example Brand 016', 'Example Brand 017', 'Example Brand 018'] },
]

function ImageSlot({ label, shape = 'wide' }: { label: string; shape?: 'wide' | 'square' }) {
  return (
    <div className={`story-image-slot story-image-slot--${shape}`} role="img" aria-label={`Image placeholder: ${label}`}>
      <span aria-hidden="true">IMAGE TO ADD</span>
      <small>{label}</small>
    </div>
  )
}

function SectionLabel({ number, children }: { number: string; children: ReactNode }) {
  return <p className="story-section-label"><span>{number}</span><span aria-hidden="true">/</span>{children}</p>
}

function StoryScreen({ id, children, className = '' }: { id?: string; children: ReactNode; className?: string }) {
  return <article id={id} className={`story-screen ${className}`}>{children}</article>
}

function App() {
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return

    const revealSelector = [
      '.story-section-label', '.story-eyebrow', 'h1', 'h2', 'h3', '.story-deck', '.story-copy',
      '.story-quote', '.story-scroll-link', '.story-cohort-stat', '.story-cohort-caption', '.story-data-row',
      '.story-pillar', '.story-interview-proof > div', '.story-interview-proof > p', '.story-brand-disclosure',
      '.story-step-title', '.story-learning-note', '.story-revenue-row', '.story-commission',
      '.story-potential-number', '.story-potential-arrow', '.story-potential-value', '.story-potential-caption',
      '.story-potential-copy', '.story-market-target', '.story-exhibition', '.story-market-close',
      '.story-goal__number', '.story-goal__title', '.story-goal__copy', '.story-closing__lead', '.story-footer--closing',
    ].join(',')
    const pages = document.querySelectorAll<HTMLElement>('.story-opening, .story-screen')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' })

    pages.forEach((page) => {
      const candidates = Array.from(page.querySelectorAll<HTMLElement>(revealSelector))
      const items = candidates.filter((item) => !item.parentElement?.closest(revealSelector))
      items.forEach((item, index) => {
        item.classList.add('story-reveal-item')
        item.style.setProperty('--story-reveal-index', String(Math.min(index, 7)))
      })
      page.classList.add('story-reveal-ready')
      observer.observe(page)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="story-page">
      <header className="story-header">
        <a className="story-brand" href="#top" aria-label="FridgeChannel investment story, back to top">
          <BrandMark name="FridgeChannel" initials="FC" tone="dark" compact />
          <span>FridgeChannel</span>
        </a>
        <span className="story-header__descriptor">INVESTMENT STORY</span>
        <nav className="story-nav" aria-label="Story sections">
          {chapters.map(([number, target, label]) => <a key={number} href={`#${target}`} aria-label={`Go to ${label}`}>{number}</a>)}
        </nav>
      </header>

      <main id="top">
        <section className="story-opening story-opening--image-01" id="story-intro" aria-labelledby="investment-story-title">
          <div className="story-opening__inner">
            <h1 id="investment-story-title">A lasting place<br />in the household.</h1>
            <p>As access to consumers becomes more contested and intermediated, CPG brands need lasting household relationships—not another messaging channel. FC helps brands create in-home retention touchpoints that <strong>make the brand an ambient presence in everyday life, rather than another interruption.</strong> Through ongoing, permissioned interactions, brands learn in-home retention habits—and turn that understanding into a proprietary retention advantage.</p>
            <a className="story-scroll-link" href="#slide-1">Explore the story <span aria-hidden="true">↓</span></a>
          </div>
          <div className="story-opening__index" aria-hidden="true">FC / 2026</div>
        </section>

        <section className="story-section story-section--hero" aria-label="FridgeChannel">
          <StoryScreen id="slide-1" className="story-screen--hero">
            <SectionLabel number="01">INTRODUCTION</SectionLabel>
            <h2 className="story-display">Fridge<br /><em>Channel</em></h2>
            <p className="story-deck">In-Home Retention Intelligence for CPG</p>
            <ImageSlot shape="wide" label="Hero image · household touchpoint in context" />
          </StoryScreen>
          <StoryScreen className="story-screen--hero-copy">
            <SectionLabel number="01">THE RETENTION CHANNEL</SectionLabel>
            <div className="story-copy story-copy--lead">
              <p><strong>FridgeChannel helps CPG brands turn product deliveries into lasting household connections—with branded physical touchpoints that consumers keep at home and tap to reorder directly from the brand.</strong></p>
              <p>Permissioned interactions generate engagement and replenishment signals, building a proprietary data foundation for specialized AI models designed to improve shopping experiences, guide brand decisions, and inform better products.</p>
            </div>
          </StoryScreen>
        </section>

        <section className="story-section story-section--problem" aria-label="A consensus on the structural problem">
          <StoryScreen id="slide-2">
            <SectionLabel number="02">THE STRUCTURAL PROBLEM</SectionLabel>
            <h2 className="story-heading">A Consensus on Structural Problem</h2>
            <p className="story-copy story-copy--lead">A consensus emerging from approximately 300 face-to-face brand interviews: stronger retention requires direct access without more interruption.</p>
            <div className="story-cohorts" aria-label="Recent quantified exhibition cohorts">
              <p className="story-eyebrow">RECENT QUANTIFIED EXHIBITION COHORTS</p>
              {[
                ['Summer Fancy Food Show 2026', '53'],
                ['SuperZoo 2026', '125'],
                ['Newtopia Now 2026', '75'],
                ['NACS Show 2026', '83'],
              ].map(([name, value]) => <div className="story-data-row" key={name}><span>{name}</span><strong>{value}</strong></div>)}
            </div>
          </StoryScreen>
          <StoryScreen className="story-screen--voice">
            <div className="story-voice">
              <SectionLabel number="02">WHAT CONSUMERS NEED</SectionLabel>
              <p className="story-copy story-copy--lead">A peaceful home—not another app, notification, email, text, or feed. When they want to buy their usual brand again, they want to go straight to it—not search, browse recommendations, or sort through “similar products.”</p>
              <blockquote className="story-quote">“When I need you, take me straight there. When I don’t, leave me in peace.”</blockquote>
            </div>
            <div className="story-voice">
              <SectionLabel number="02">WHAT BRANDS NEED</SectionLabel>
              <p className="story-copy story-copy--lead">A direct way for existing customers to buy again—without paying for another ad to bring them back, or having search results and recommendations steer them toward competitors.</p>
              <blockquote className="story-quote">“When customers want our products, bring them straight to us—not to another ad or a competitor.”</blockquote>
            </div>
          </StoryScreen>
        </section>

        <section className="story-section story-section--solution" aria-label="Ambient Connected Household solution">
          <StoryScreen id="slide-3" className="story-screen--solution-intro">
            <SectionLabel number="03">THE SOLUTION</SectionLabel>
            <h2 className="story-heading">Ambient Connected Household is the Solution</h2>
            <p className="story-copy">Four pillars make the household connection useful, welcome, and entirely on the household’s terms.</p>
            <SectionLabel number="03">THE FOUR PILLARS</SectionLabel>
            <div className="story-pillar-list story-pillar-list--solution">
              <article className="story-pillar"><span className="story-pillar__number">01</span><div><h3>Ambient Belonging</h3><p>A beautiful, welcome presence in household routines—not another app, feed, or notification demanding attention.</p></div></article>
              <article className="story-pillar"><span className="story-pillar__number">02</span><div><h3>Independent Access</h3><p>A direct path to the brand when needed—without paid rediscovery, algorithmic detours, or competing product recommendations.</p></div></article>
              <article className="story-pillar"><span className="story-pillar__number">03</span><div><h3>Adaptive Intelligence</h3><p>Learn in-home retention habits through permissioned interactions, then personalize the experience to make the next purchase easier and more useful.</p></div></article>
              <article className="story-pillar"><span className="story-pillar__number">04</span><div><h3>Household Agency</h3><p>The household decides when to connect, what to share, and when to buy. Available when needed. Quiet when not.</p></div></article>
            </div>
          </StoryScreen>
          <StoryScreen className="story-screen--metric">
            <p className="story-eyebrow">THE GROWTH METRIC</p>
            <strong className="story-household-metric__title">Ambient Connected<br />Households</strong>
            <p className="story-household-metric__copy">With FC, brands can grow their number of Ambient Connected Households—a metric CPG believe will become central to profitable CPG growth.</p>
          </StoryScreen>
          <StoryScreen className="story-screen--proof">
            <div className="story-interview-proof" id="interviewed-brands">
              <div><strong>~300</strong><span>CPG brands interviewed<br />face-to-face</span></div>
              <p>This consensus emerged from face-to-face interviews with approximately 300 CPG brands.</p>
              <details className="story-brand-disclosure">
                <summary>View interviewed brands <span aria-hidden="true">⌄</span></summary>
                <div className="story-brand-disclosure__panel">
                  <p className="story-eyebrow">FICTIONAL SAMPLE DATA</p>
                  <p className="story-footnote">18 example names shown. Replace with the confirmed brand list when available.</p>
                  {sampleInterviewedBrands.map(({ cohort, brands }) => <div className="story-brand-group" key={cohort}>
                    <h4>{cohort}</h4>
                    <ul>{brands.map((brand) => <li key={brand}>{brand}</li>)}</ul>
                  </div>)}
                </div>
              </details>
            </div>
          </StoryScreen>
        </section>

        <section className="story-section story-section--process" aria-label="How FC works">
          <StoryScreen id="slide-4" className="story-screen--steps">
            <div className="story-step">
              <SectionLabel number="04 · STEP 01">CREATE AND DELIVER</SectionLabel>
              <h2 className="story-heading">Create and deliver.</h2>
              <p className="story-copy story-copy--lead">Brands work with FC to create beautiful retention touchpoints that consumers welcome into their homes. Each touchpoint is included in a shipping box or directly inside the product package.</p>
            </div>
            <div className="story-step">
              <SectionLabel number="04 · STEP 02">BECOME PART OF EVERYDAY LIFE</SectionLabel>
              <h2 className="story-heading">Become part of<br />everyday life.</h2>
              <p className="story-copy story-copy--lead">Consumers place the current touchpoint on their refrigerator. The brand stays naturally visible throughout household routines—without another message or notification.</p>
            </div>
            <div className="story-step">
              <SectionLabel number="04 · STEP 03">TAP, SHOP, AND REORDER</SectionLabel>
              <h2 className="story-heading">Tap, shop,<br />and reorder.</h2>
              <p className="story-copy story-copy--lead">When needed, a tap opens a personalized, brand-directed shopping experience—a direct path to the next purchase, without searching or competing recommendations.</p>
            </div>
          </StoryScreen>
        </section>

        <section className="story-section story-section--business" aria-label="Business model">
          <StoryScreen id="slide-5" className="story-screen--revenue">
            <SectionLabel number="05">THE BUSINESS MODEL</SectionLabel>
            <h2 className="story-heading">Business Model</h2>
            <p className="story-copy story-copy--lead"><strong>FC aims to become CPG’s leading in-home repeat-purchase channel—earning a share of every sale it drives.</strong></p>
            <div className="story-revenue-list">
              <article className="story-revenue-row"><span className="story-revenue-row__number">01</span><div><h3>Product revenue</h3><p>CPG brands purchase branded retention touchpoints at volume-based prices.</p><strong className="story-price">$0.60–$2.49 <small>per unit</small></strong></div></article>
            </div>
          </StoryScreen>
          <StoryScreen className="story-screen--performance">
            <SectionLabel number="05 · 02">PERFORMANCE REVENUE</SectionLabel>
            <h2 className="story-heading">Earn on every<br />sale it drives.</h2>
            <p className="story-copy story-copy--lead">FC earns a commission on net sales generated through its touchpoints.</p>
            <div className="story-commission story-commission--large"><span><strong>10%</strong><small>DTC orders</small></span><i aria-hidden="true"/><span><strong>5%</strong><small>Amazon orders</small></span></div>
          </StoryScreen>
          <StoryScreen className="story-screen--expansion">
            <SectionLabel number="05 · 03">ACCOUNT EXPANSION</SectionLabel>
            <h2 className="story-heading">Grow deployment.<br />Grow the channel.</h2>
            <p className="story-copy story-copy--lead">Brands can start with one deployment, then expand to more households, products, and channels. Larger deployments generate additional product revenue; purchases through deployed touchpoints generate ongoing commissions.</p>
            <p className="story-learning-note story-learning-note--expansion">Deployment optimization and retention strategy are included—not separate consulting fees.</p>
          </StoryScreen>
        </section>

        <section className="story-section story-section--potential" aria-label="Revenue potential">
          <StoryScreen id="slide-6" className="story-screen--potential">
            <SectionLabel number="06">REVENUE POTENTIAL</SectionLabel>
            <p className="story-eyebrow story-eyebrow--dark">U.S. HOUSEHOLD PENETRATION</p>
            <strong className="story-potential-number">1%</strong>
            <span className="story-potential-arrow" aria-hidden="true">↓</span>
            <h2 className="story-potential-value">$10–20M</h2>
            <p className="story-potential-caption">Annual revenue potential</p>
            <p className="story-potential-copy">Even at just 1% household penetration, FC could generate an estimated $10–20 million in annual revenue through the repeat purchases its brand connections enable.</p>
            <p className="story-footnote">Illustrative projection. Supporting assumptions and financial model available in the data room upon request.</p>
          </StoryScreen>
        </section>

        <section className="story-section story-section--market" aria-label="Go-to-market and account expansion">
          <StoryScreen id="slide-7" className="story-screen--market-intro">
            <SectionLabel number="07">GO-TO-MARKET &amp; ACCOUNT EXPANSION</SectionLabel>
            <h2 className="story-heading">Show the product.<br /><em>Win the brand.</em></h2>
            <p className="story-copy story-copy--lead">Live product demos at trade shows are FC’s primary acquisition strategy.</p>
            <div className="story-market-target">
              <strong>500<span>+</span></strong>
              <p>brands to meet<br />face-to-face over the next 12 months</p>
            </div>
            <p className="story-copy story-copy--lead">Show the product. Win the brand. Live demonstrations open a direct conversation with decision-makers.</p>
          </StoryScreen>
          <StoryScreen className="story-screen--exhibitions">
            <div className="story-exhibitions__heading"><div><p className="story-eyebrow">TARGET EXHIBITIONS</p><h3>Next 12 months</h3></div><span>PROSPECT BRANDS*</span></div>
            {[
              ['NACS Show 2026', '42'],
              ['LongevityFest 2026', '47'],
              ['Winter FancyFaire 2027', '31'],
              ['2027 KeHE Summer Show', '112', 'Prior-edition reference'],
              ['Natural Products Expo West 2027', '227'],
              ['Global Pet Expo 2027', '47'],
              ['COOC/OOCC 2027 Annual Olive Oil Conference', 'TBD', 'Current-edition list not yet public'],
              ['Sweets & Snacks Expo 2027', '33'],
              ['Summer Fancy Food Show 2027', '53', 'Prior-edition reference'],
            ].map(([name, value, note]) => <div className="story-exhibition" key={name}><span>{name}{note && <small>{note}</small>}</span><strong>{value}</strong></div>)}
            <p className="story-market-close">One brand relationship opens the door to <em>thousands</em> of household connections.</p>
          </StoryScreen>
        </section>

        <section className="story-section story-section--ambition" aria-label="24-month ambition">
          <StoryScreen id="slide-8" className="story-screen--goal story-screen--goal-primary">
            <SectionLabel number="08 · GOAL 01">20% OF U.S. HOUSEHOLDS</SectionLabel>
            <strong className="story-goal__number">20%</strong>
            <h2 className="story-goal__title">of U.S. households</h2>
            <p className="story-goal__copy">Enable CPG brands to build ambient connections with 20% of U.S. households through in-home retention touchpoints—giving brands a lasting place in household routines and a direct path to the next purchase, without repeatedly buying attention.</p>
          </StoryScreen>
          <StoryScreen className="story-screen--goal story-screen--foundation">
            <SectionLabel number="08 · GOAL 02">THE INTELLIGENCE FOUNDATION</SectionLabel>
            <h2 className="story-heading">The leading CPG in-home intelligence foundation</h2>
            <p className="story-goal__copy">Build the leading data foundation for CPG in-home retention through ongoing, permissioned household interactions. Use this proprietary understanding of in-home retention habits to train specialized AI models that help brands personalize shopping experiences and drive repeat purchase.</p>
          </StoryScreen>
        </section>

        <section className="story-section story-section--closing" aria-label="Investment partners">
          <StoryScreen id="slide-9" className="story-screen--closing">
            <SectionLabel number="09">INVESTMENT PARTNERS</SectionLabel>
            <div className="story-closing__content">
              <p className="story-eyebrow">THE OPPORTUNITY</p>
              <h2>Help build CPG’s direct connection to the household.</h2>
              <p className="story-closing__lead">Seeking investment partners for FC’s first commercial deployments and retention intelligence foundation.</p>
              <p className="story-footnote">Team, financial model, market analysis, and fundraising terms available in the data room.</p>
            </div>
            <footer className="story-footer story-footer--closing">
              <BrandMark name="FridgeChannel" initials="FC" tone="dark" compact />
              <span>IN-HOME RETENTION INTELLIGENCE</span>
              <a href="#top" aria-label="Back to top">BACK TO TOP ↑</a>
            </footer>
          </StoryScreen>
        </section>
      </main>
    </div>
  )
}

export { App }
