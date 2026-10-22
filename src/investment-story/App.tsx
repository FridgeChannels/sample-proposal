import { useLayoutEffect, useState, type ReactNode } from 'react'
import { BrandMark } from '../components/ui/BrandMark'
import ScrollRevealContent from '../components/ui/ScrollRevealContent'
import { TextGenerateEffect } from '../components/ui/TextGenerateEffect'
import AnimatedText from '../components/ui/animated-text'
import './styles.css'

const sampleInterviewedBrands = [
  { cohort: 'SuperZoo 2026', brands: ['Example Brand 001', 'Example Brand 002', 'Example Brand 003', 'Example Brand 004', 'Example Brand 005', 'Example Brand 006'] },
  { cohort: 'Newtopia Now 2026', brands: ['Example Brand 007', 'Example Brand 008', 'Example Brand 009', 'Example Brand 010', 'Example Brand 011', 'Example Brand 012'] },
  { cohort: 'NACS Show 2026', brands: ['Example Brand 013', 'Example Brand 014', 'Example Brand 015', 'Example Brand 016', 'Example Brand 017', 'Example Brand 018'] },
]
const heroCopyPrimary = 'FridgeChannel helps CPG brands turn product deliveries into lasting household connections—with branded physical touchpoints that consumers keep at home and tap to reorder directly from the brand.'
const heroCopySecondary = 'Permissioned interactions generate engagement and replenishment signals, building a proprietary data foundation for specialized AI models designed to improve shopping experiences, guide brand decisions, and inform better products.'
const heroCopyStaggerDuration = 0.04
const heroCopyTransitionDuration = 0.5
const heroCopySecondaryStartDelay = (heroCopyPrimary.split(' ').length - 1) * heroCopyStaggerDuration + heroCopyTransitionDuration
const solutionPillars = [
  { title: 'Ambient Belonging', description: 'A beautiful, welcome presence in household routines—not another app, feed, or notification demanding attention.' },
  { title: 'Independent Access', description: 'A direct path to the brand when needed—without paid rediscovery, algorithmic detours, or competing product recommendations.' },
  { title: 'Adaptive Intelligence', description: 'Learn in-home retention habits through permissioned interactions, then personalize the experience to make the next purchase easier and more useful.' },
  { title: 'Household Agency', description: 'The household decides when to connect, what to share, and when to buy. Available when needed. Quiet when not.' },
]
const processSteps = [
  { title: 'Create and deliver.', description: 'Brands work with FC to create beautiful retention touchpoints that consumers welcome into their homes. Each touchpoint is included in a shipping box or directly inside the product package.' },
  { title: 'Become part of everyday life.', description: 'Consumers place the current touchpoint on their refrigerator. The brand stays naturally visible throughout household routines—without another message or notification.' },
  { title: 'Tap, shop, and reorder.', description: 'When needed, a tap opens a personalized, brand-directed shopping experience—a direct path to the next purchase, without searching or competing recommendations.' },
]

function StoryScreen({ id, children, className = '' }: { id?: string; children?: ReactNode; className?: string }) {
  return <article id={id} className={`story-screen ${className}`}>{children}</article>
}

function ProductTapAnimation() {
  return (
    <div className="story-product-demo" role="group" aria-label="Product experience animation">
      <p className="story-eyebrow story-product-demo__label">PRODUCT EXPERIENCES</p>
      <svg className="story-product-tap" viewBox="0 0 620 352" role="img" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="tap-scene-paper" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#faf7f0" />
            <stop offset="1" stopColor="#e9e5dc" />
          </linearGradient>
          <linearGradient id="tap-fridge-face" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#e4e7e5" />
            <stop offset=".56" stopColor="#f4f4f0" />
            <stop offset="1" stopColor="#d9dddc" />
          </linearGradient>
          <filter id="tap-scene-shadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="12" stdDeviation="11" floodColor="#10201f" floodOpacity=".14" />
          </filter>
        </defs>
        <rect width="620" height="352" rx="23" fill="url(#tap-scene-paper)" />
        <circle cx="151" cy="180" r="133" fill="#ead7c7" fillOpacity=".45" />
        <g filter="url(#tap-scene-shadow)">
          <rect x="358" y="24" width="235" height="304" rx="23" fill="url(#tap-fridge-face)" stroke="#c5cbc8" strokeWidth="2" />
          <path d="M369 190h213" stroke="#c9cecb" strokeWidth="2" />
          <path d="M558 78v77" stroke="#a8b0ad" strokeWidth="6" strokeLinecap="round" />
          <path d="M378 42v132" stroke="#fff" strokeOpacity=".55" strokeWidth="2" />
        </g>
        <rect x="458" y="132" width="48" height="66" rx="10" fill="#d95130" stroke="#fff" strokeOpacity=".6" strokeWidth="2" filter="url(#tap-scene-shadow)" />
        <path d="M480 151c7 5 7 14 0 19m7-25c12 9 12 23 0 32" fill="none" stroke="#fff4e9" strokeWidth="2.5" strokeLinecap="round" />
        <circle className="story-product-tap__pulse" cx="481" cy="165" r="33" fill="none" stroke="#d95130" strokeWidth="3" />
        <path d="M472 183h18" stroke="#fff4e9" strokeWidth="2" strokeLinecap="round" />

        <g className="story-product-tap__arm">
          <path d="M-22 246c47-2 97-15 151-37" fill="none" stroke="#183d3a" strokeWidth="58" strokeLinecap="round" />
          <path d="M-8 225c34-4 65-13 96-26" fill="none" stroke="#28514a" strokeWidth="3" strokeLinecap="round" opacity=".78" />
          <path d="M111 216c48-15 99-33 153-46 26-7 47-10 66-11" fill="none" stroke="#cf9575" strokeWidth="34" strokeLinecap="round" />
          <path d="M115 192c7 12 13 23 17 35" fill="none" stroke="#f0bea0" strokeWidth="3" strokeLinecap="round" opacity=".8" />
        </g>

        <g className="story-product-tap__phone">
          <path d="M327 166c-11-7-19-2-19 8 0 8 8 17 19 22l12-8-2-21-10-1Z" fill="#cf9575" />
          <rect x="337" y="111" width="56" height="96" rx="13" fill="#17201f" />
          <rect x="342" y="117" width="46" height="83" rx="8" fill="#fffaf1" />
          <rect x="357" y="123" width="16" height="3" rx="1.5" fill="#c7c6bf" />
          <circle cx="365" cy="192" r="3" fill="#c7c6bf" />
          <path d="M383 151c9 0 13 6 11 14l-4 14c-2 7-10 8-13 2l-3-12c-2-10 0-17 9-18Z" fill="#d99d7d" />
          <path d="M384 155c5 2 7 6 6 11" fill="none" stroke="#efbea0" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  )
}

function App() {
  const [openPillar, setOpenPillar] = useState<number | null>(null)

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return

    const revealSelector = [
      '.story-eyebrow', '.story-section-kicker', 'h1', 'h2', 'h3', '.story-deck', '.story-copy',
      '.story-quote', '.story-cohort-stat', '.story-cohort-caption', '.story-data-row',
      '.story-pillar', '.story-interview-proof > div', '.story-interview-proof > p', '.story-brand-disclosure',
      '.story-step-title', '.story-learning-note', '.story-revenue-row', '.story-commission',
      '.story-potential-number', '.story-potential-arrow', '.story-potential-value', '.story-potential-caption',
      '.story-potential-copy', '.story-market-target', '.story-exhibition', '.story-market-close', '.story-process__step', '.story-process__closing-note',
      '.story-goal__copy', '.story-closing__lead', '.story-footer--closing',
    ].join(',')
    const pages = document.querySelectorAll<HTMLElement>('.story-screen')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' })

    pages.forEach((page) => {
      const candidates = Array.from(page.querySelectorAll<HTMLElement>(revealSelector))
      const items = candidates.filter((item) => !item.parentElement?.closest(revealSelector) && !item.matches('.text-generate-effect'))
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
      <main id="top">
        <section className="story-section story-section--hero" aria-label="FridgeChannel">
          <StoryScreen id="slide-1" className="story-screen--hero">
            <div className="story-brand story-brand--centered" aria-hidden="true">
              <span className="story-brand__mark">
                <img src="/investment-story/fridgechannel-mark.png" alt="" />
              </span>
            </div>
            <h2 className="story-display"><AnimatedText text="Fridge Channel" animationType="letters" staggerDelay={0.035} duration={0.55} /></h2>
            <p className="story-deck"><AnimatedText text="In-Home Retention Intelligence for CPG" animationType="words" staggerDelay={0.08} duration={0.55} delay={0.25} /></p>
          </StoryScreen>
          <StoryScreen id="slide-video" className="story-screen--video">
            <p className="story-video-label">展示视频</p>
          </StoryScreen>
          <StoryScreen className="story-screen--hero-copy">
            <TextGenerateEffect
              as="p"
              className="story-copy story-copy--lead story-copy--light"
              staggerDuration={heroCopyStaggerDuration}
              transition={{ duration: heroCopyTransitionDuration, ease: [0.22, 0.7, 0.2, 1] }}
              emphasis={heroCopyPrimary}
            >
              {heroCopyPrimary}
            </TextGenerateEffect>
            <TextGenerateEffect
              as="p"
              className="story-copy story-copy--lead"
              staggerDuration={heroCopyStaggerDuration}
              startDelay={heroCopySecondaryStartDelay}
              transition={{ duration: heroCopyTransitionDuration, ease: [0.22, 0.7, 0.2, 1] }}
            >
              {heroCopySecondary}
            </TextGenerateEffect>
          </StoryScreen>
        </section>

        <section className="story-section story-section--problem" aria-label="A consensus on the structural problem">
          <StoryScreen id="slide-2">
            <h2 className="story-heading">A Consensus on Structural Problem</h2>
            <p className="story-copy story-copy--lead">A consensus emerging from approximately 300 face-to-face brand interviews: stronger retention requires direct access without more interruption.</p>
            <div className="story-cohorts" aria-label="Recent quantified exhibition cohorts">
              <div className="story-cohorts__heading">
                <p className="story-eyebrow">EXHIBITION COHORTS</p>
                <span>Viewed Brands</span>
              </div>
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
              <h3 className="story-voice__title">What consumers need:</h3>
              <p className="story-copy story-copy--lead">A peaceful home—not another app, notification, email, text, or feed. When they want to buy their usual brand again, they want to go straight to it—not search, browse recommendations, or sort through “similar products.”</p>
              <div className="story-voice__speaker">
                <img className="story-voice__illustration" src="/investment-story/consumer-illustration.png" alt="Orange customer profile illustration" />
                <span aria-hidden="true">：</span>
              </div>
              <blockquote className="story-quote">“When I need you, take me straight there. When I don’t, leave me in peace.”</blockquote>
            </div>
          </StoryScreen>
          <StoryScreen className="story-screen--voice">
            <div className="story-voice">
              <h3 className="story-voice__title">What brands need:</h3>
              <p className="story-copy story-copy--lead">A direct way for existing customers to buy again—without paying for another ad to bring them back, or having search results and recommendations steer them toward competitors.</p>
              <div className="story-voice__speaker">
                <img className="story-voice__illustration" src="/investment-story/brand-illustration.png" alt="Orange brand storefront illustration" />
                <span aria-hidden="true">：</span>
              </div>
              <blockquote className="story-quote">“When customers want our products, bring them straight to us—not to another ad or a competitor.”</blockquote>
            </div>
          </StoryScreen>
        </section>

        <section className="story-section story-section--solution" aria-label="Ambient Connected Household solution">
          <StoryScreen id="slide-3" className="story-screen--solution-intro">
            <h2 className="story-heading">Ambient Connected Household is the Solution</h2>
            <p className="story-copy">Four pillars make the household connection useful, welcome, and entirely on the household’s terms.</p>
            <div className="story-pillar-list story-pillar-list--solution">
              {solutionPillars.map(({ title, description }, index) => {
                const isOpen = openPillar === index
                const panelId = `solution-pillar-description-${index + 1}`

                return <article className="story-pillar" key={title}>
                  <span className="story-pillar__number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <div className="story-pillar__content">
                    <h3>
                      <button
                        className="story-pillar__toggle"
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenPillar(isOpen ? null : index)}
                      >
                        <span>{title}</span>
                        <span className="story-pillar__chevron" aria-hidden="true">⌄</span>
                      </button>
                    </h3>
                    <p className="story-pillar__description" id={panelId} hidden={!isOpen}>{description}</p>
                  </div>
                </article>
              })}
            </div>
          </StoryScreen>
          <StoryScreen className="story-screen--metric">
            <p className="story-eyebrow">THE GROWTH METRIC</p>
            <strong className="story-household-metric__title">Ambient Connected<br />Households</strong>
            <p className="story-household-metric__copy">With FC, brands can grow their number of Ambient Connected Households—a metric CPG believe will become central to profitable CPG growth.</p>
            <img className="story-household-metric__visual" src="/investment-story/household-growth-chart.png" alt="Connected line chart illustration" />
          </StoryScreen>
          <StoryScreen id="interviewed-brands" className="story-screen--interview-proof">
            <div className="story-interview-proof">
              <div><strong>~300</strong><span>CPG brands interviewed<br />face-to-face</span></div>
              <p>This consensus emerged from face-to-face interviews with approximately 300 CPG brands.</p>
              <details className="story-brand-disclosure">
                <summary>View interviewed brands <span className="story-brand-disclosure__chevron" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="m5 9 7 7 7-7" /></svg></span></summary>
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
          <ScrollRevealContent
            id="slide-4"
            heading="From product delivery to an ambient connected household."
            items={processSteps}
            closingNote="Each permissioned interaction helps brands understand in-home retention habits—and make the next experience more useful."
          />
        </section>

        <section className="story-section story-section--business" aria-label="Business model">
          <StoryScreen id="slide-5" className="story-screen--revenue">
            <p className="story-section-kicker story-business__kicker">Business Model</p>
            <p className="story-copy story-copy--lead"><strong>FC aims to become CPG’s leading in-home repeat-purchase channel—earning a share of every sale it drives.</strong></p>
            <div className="story-revenue-list">
              <article className="story-revenue-row"><div><h3><span className="story-business__index">01</span>Product revenue</h3><p>CPG brands purchase branded retention touchpoints at volume-based prices.</p><strong className="story-price">$0.60–$2.49 <small>per unit</small></strong></div></article>
            </div>
          </StoryScreen>
          <StoryScreen className="story-screen--performance">
            <p className="story-section-kicker story-business__kicker">Business Model</p>
            <p className="story-business__item-index">02 · Performance revenue</p>
            <h2 className="story-heading">Earn on every<br />sale it drives.</h2>
            <p className="story-copy story-copy--lead">FC earns a commission on net sales generated through its touchpoints.</p>
            <div className="story-commission story-commission--large"><span className="story-commission__dtc"><strong>10%</strong><small>DTC orders</small></span><i aria-hidden="true"/><span><strong>5%</strong><small>Amazon orders</small></span></div>
          </StoryScreen>
          <StoryScreen className="story-screen--expansion">
            <p className="story-section-kicker story-business__kicker">Business Model</p>
            <p className="story-business__item-index">03 · Account expansion</p>
            <h2 className="story-heading">Grow deployment.<br />Grow the channel.</h2>
            <p className="story-copy story-copy--lead">Brands can start with one deployment, then expand to more households, products, and channels. Larger deployments generate additional product revenue; purchases through deployed touchpoints generate ongoing commissions.</p>
            <p className="story-learning-note story-learning-note--expansion">Deployment optimization and retention strategy are included—not separate consulting fees.</p>
          </StoryScreen>
        </section>

        <section className="story-section story-section--potential" aria-label="Revenue potential">
          <StoryScreen id="slide-6" className="story-screen--potential">
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
              ['2027 KeHE Summer Show', '112'],
              ['Natural Products Expo West 2027', '227'],
              ['Global Pet Expo 2027', '47'],
              ['COOC/OOCC 2027 Annual Olive Oil Conference', 'TBD'],
              ['Sweets & Snacks Expo 2027', '33'],
              ['Summer Fancy Food Show 2027', '53'],
            ].map(([name, value]) => <div className="story-exhibition" key={name}><span>{name}</span><strong>{value}</strong></div>)}
            <p className="story-market-close">One brand relationship opens the door to <em>thousands</em> of household connections.</p>
          </StoryScreen>
        </section>

        <section className="story-section story-section--ambition" aria-label="24-month ambition">
          <StoryScreen id="slide-8" className="story-screen--goal story-screen--goal-primary">
            <p className="story-section-kicker story-goal__kicker">Goal 1</p>
            <p className="story-goal__copy">Enable CPG brands to build ambient connections with <span className="story-goal__number">20%</span> <strong className="story-goal__emphasis">of U.S. households through in-home retention touchpoints</strong>—giving brands a lasting place in household routines and a direct path to the next purchase, without repeatedly buying attention.</p>
          </StoryScreen>
          <StoryScreen className="story-screen--goal story-screen--foundation">
            <p className="story-section-kicker story-goal__kicker">Goal 2</p>
            <h2 className="story-heading">The leading CPG in-home intelligence foundation</h2>
            <p className="story-goal__copy">Build the leading data foundation for CPG in-home retention through ongoing, permissioned household interactions. Use this proprietary understanding of in-home retention habits to train specialized AI models that help brands personalize shopping experiences and drive repeat purchase.</p>
          </StoryScreen>
        </section>

        <section className="story-section story-section--product-experiences" aria-label="Product experiences">
          <StoryScreen id="slide-10" className="story-screen--product-experiences">
            <ProductTapAnimation />
            <div className="story-product-selection">
              <div className="story-product-entry-grid">
                <a className="story-product-entry story-product-entry--amazon" href="/fc-asin-plus-sample.html">
                  <span className="story-product-entry__index">01</span>
                  <h3>Amazon Experience</h3>
                  <p>See where an Amazon customer lands after tapping.</p>
                  <span className="story-product-entry__action">Try Amazon <span aria-hidden="true">↗</span></span>
                </a>
                <a className="story-product-entry story-product-entry--dtc" href="/about-fridgechannel.html">
                  <span className="story-product-entry__index">02</span>
                  <h3>DTC Experience</h3>
                  <p>See the direct-to-brand shopping experience after tap.</p>
                  <span className="story-product-entry__action">Try DTC <span aria-hidden="true">↗</span></span>
                </a>
              </div>
            </div>
          </StoryScreen>
        </section>

        <section className="story-section story-section--closing" aria-label="Investment partners">
          <StoryScreen id="slide-11" className="story-screen--closing">
            <div className="story-closing__content">
              <p className="story-eyebrow">THE OPPORTUNITY</p>
              <h2>Help build CPG’s direct connection to the household.</h2>
              <p className="story-closing__lead">Seeking investment partners for FC’s first commercial deployments and retention intelligence foundation.</p>
              <p className="story-footnote">Team, financial model, market analysis, and fundraising terms available in the data room.</p>
            </div>
            <footer className="story-footer story-footer--closing">
              <a href="#top" aria-label="Back to top">BACK TO TOP ↑</a>
            </footer>
          </StoryScreen>
        </section>
      </main>
    </div>
  )
}

export { App }
