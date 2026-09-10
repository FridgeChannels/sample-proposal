import { FormEvent, useState } from 'react'
import campaignCss from './styles.css?raw'

const calendlyUrl = 'https://calendly.com/billy-fridgechannels/fridge-channel-pilot-meeting'

const outcomes = [
  {
    number: '01',
    title: 'A product customers see every day',
    body: 'Your FC Magnet can live on the fridge door — putting your brand in front of customers multiple times a day, every time they open the fridge.',
    icon: '/assets/christmas-asin/outcome-icons/Ornament.png',
  },
  {
    number: '02',
    title: 'A tap-to-reorder touchpoint',
    body: 'Customers can tap the FC Magnet and go directly back to your Amazon listing, Brand Store, or approved reorder path.',
    icon: '/assets/christmas-asin/outcome-icons/Tipsy-Present.png',
  },
  {
    number: '03',
    title: 'A post-purchase retention touchpoint',
    body: 'Turn the moment after an Amazon purchase into an owned customer interaction your brand can record and learn from.',
    icon: '/assets/christmas-asin/outcome-icons/Elf-handstand.png',
  },
  {
    number: '04',
    title: 'A zero-party data moment',
    body: 'Use a Smart Survey or Christmas game to collect preferences, usage context, gifting context, and future purchase intent from Amazon customers.',
    icon: '/assets/christmas-asin/outcome-icons/Footer-Cheers.png',
  },
  {
    number: '05',
    title: 'A cross-sell opportunity',
    body: 'Recommend related ASINs, bundles, refills, accessories, subscriptions, or next-purchase offers at the right moment.',
    icon: '/assets/christmas-asin/outcome-icons/Tipsy-Present.png',
  },
]

const productTypes = [
  'Christmas bundle',
  'Seasonal ASIN',
  'Giftable product',
  'Limited edition product',
  'Existing ASIN with Christmas packaging',
  'Other',
]

const campaignGoals = [
  'Thank loyal or VIP customers',
  'Launch a Christmas gift box or seasonal bundle',
  'Create a memorable unboxing moment',
  'Increase daily routine exposure at home',
  'Create an Amazon retention touchpoint on the fridge door',
  'Collect zero-party feedback data from Amazon customers',
  'Other',
]

const distributionOptions = ['5,000–10,000 units', '10,000–50,000 units', '50,000+ units']
const deliveryOptions = [
  '4th week of October',
  '1st week of November',
  '2nd week of November',
  '3rd week of November',
  '4th week of November',
]
const budgetOptions = ['$1–$2 per unit', '$2–$2.99+ per unit', '$3+ per unit']

function MultiSelect({
  legend,
  options,
  selected,
  onToggle,
  error,
}: {
  legend: string
  options: string[]
  selected: string[]
  onToggle: (option: string) => void
  error: boolean
}) {
  return (
    <fieldset className="campaign-question" aria-invalid={error} aria-required="true">
      <legend>{legend}</legend>
      <p className="campaign-input-type">Multi-select</p>
      <div className="campaign-choice-grid">
        {options.map((option) => {
          const active = selected.includes(option)
          return (
            <button
              className="campaign-choice"
              type="button"
              key={option}
              aria-pressed={active}
              onClick={() => onToggle(option)}
            >
              <span className="campaign-choice-mark" aria-hidden="true">{active ? '✓' : '+'}</span>
              <span>{option}</span>
            </button>
          )
        })}
      </div>
      {selected.map((value) => <input key={value} type="hidden" name={legend.startsWith('ASIN Q1') ? 'productType' : 'campaignGoal'} value={value} />)}
      {error && <p className="campaign-field-error" role="alert">Choose at least one option.</p>}
    </fieldset>
  )
}

function SingleSelect({ legend, name, options }: { legend: string; name: string; options: string[] }) {
  return (
    <fieldset className="campaign-question" aria-required="true">
      <legend>{legend}</legend>
      <p className="campaign-input-type">Single select</p>
      <div className="campaign-radio-list">
        {options.map((option) => (
          <label className="campaign-radio" key={option}>
            <input type="radio" name={name} value={option} required />
            <span className="campaign-radio-dot" aria-hidden="true" />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function ChristmasAsinCampaign() {
  const [productSelection, setProductSelection] = useState<string[]>([])
  const [goalSelection, setGoalSelection] = useState<string[]>([])
  const [selectionErrors, setSelectionErrors] = useState({ product: false, goal: false })

  const toggle = (value: string, values: string[], setter: (next: string[]) => void) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return
    const nextErrors = { product: productSelection.length === 0, goal: goalSelection.length === 0 }
    setSelectionErrors(nextErrors)
    if (nextErrors.product || nextErrors.goal) {
      const invalidGroup = form.querySelector<HTMLElement>('[aria-invalid="true"]')
      window.requestAnimationFrame(() => invalidGroup?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      return
    }
    if (calendlyUrl) window.location.assign(calendlyUrl)
  }

  return (
    <>
      <style>{campaignCss}</style>
      <div className="christmas-campaign">
        <main>
          <section className="campaign-video-section" aria-label="ASIN Plus video">
            <video className="campaign-video" controls playsInline preload="metadata">
              <source src="/assets/christmas-asin/asin-plus.mp4" type="video/mp4" />
              Your browser does not support embedded video.
            </video>
          </section>

          <section className="campaign-hero" id="top">
            <header className="campaign-nav">
              <img className="campaign-holly" src="/assets/christmas-asin/wix-holly-clean.png" alt="" />
            </header>
            <div className="campaign-wrap campaign-hero-copy">
              <h1>Turn Your Amazon Holiday Product Into a Repeat Purchase Touchpoint</h1>
              <p className="campaign-lede">FC turns your Amazon Christmas product into an AI-powered NFC Magnet customers can see every day, tap, and buy from Amazon again.</p>
              <p className="campaign-support">Built for Amazon brands preparing Christmas bundles, seasonal ASINs, giftable products, or post-purchase holiday campaigns that deserve to stay in the customer’s home — and keep driving action after the first Amazon order.</p>
              <a className="campaign-primary-action" href={calendlyUrl}>Apply and book your fit call<span aria-hidden="true">→</span></a>
            </div>
            <div className="campaign-hero-image" role="img" aria-label="Warm, softly blurred Christmas celebration scene" />
            <img className="campaign-hero-overlay" src="/assets/christmas-asin/hero-overlay.png" alt="" />
          </section>

          <section className="campaign-outcomes" id="value" aria-labelledby="outcomes-title">
            <div className="campaign-wrap campaign-section-heading">
              <h2 id="outcomes-title">What FC Turns Your Amazon<br />Christmas Product / Gift Into</h2>
            </div>
            <div className="campaign-wrap campaign-outcome-list">
              {outcomes.map((outcome) => (
                <article className="campaign-outcome" key={outcome.number}>
                  <span className="campaign-outcome-number">{outcome.number}</span>
                  <span className="campaign-outcome-icon"><img src={outcome.icon} alt="" /></span>
                  <div>
                    <h3>{outcome.title}</h3>
                    <p>{outcome.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="campaign-offer" id="offer" aria-labelledby="offer-title">
            <div className="campaign-offer-snow" aria-hidden="true">✦</div>
            <div className="campaign-wrap campaign-offer-grid">
              <div>
                <p className="campaign-kicker">Christmas-only pilot offer</p>
                <h2 id="offer-title">Lifetime <span className="campaign-zero">0</span> service fee + <span className="campaign-zero">0</span> commission</h2>
              </div>
              <div className="campaign-offer-detail">
                <p>For selected Amazon brands approved for the Christmas Pilot.</p>
                <strong>Apply before Oct 1, 2026.</strong>
              </div>
            </div>
          </section>

          <section className="campaign-application" id="apply" aria-labelledby="apply-title">
            <div className="campaign-wrap campaign-application-layout">
              <header className="campaign-form-intro">
                <h2 id="apply-title">Tell us what you’re planning.</h2>
                <p>Complete the guided input below. Every field is required and your answers prepare the fit call.</p>
              </header>

              <form className="campaign-form" onSubmit={handleSubmit} noValidate>
                <section className="campaign-form-section" aria-labelledby="contact-title">
                  <div className="campaign-form-section-heading">
                    <span>01</span>
                    <div><h3 id="contact-title">Basic contact info</h3><p>Required contact and Amazon product details.</p></div>
                  </div>
                  <div className="campaign-fields">
                    <label><span>Full Name</span><input name="fullName" type="text" autoComplete="name" placeholder="Your name" required /></label>
                    <label><span>Title</span><input name="title" type="text" autoComplete="organization-title" placeholder="Your role" required /></label>
                    <label><span>Phone</span><input name="phone" type="tel" autoComplete="tel" placeholder="Phone number" required /></label>
                    <label><span>Work Email</span><input name="email" type="email" autoComplete="email" placeholder="you@brand.com" required /></label>
                    <label><span>Brand Name</span><input name="brand" type="text" autoComplete="organization" placeholder="Brand name" required /></label>
                    <label><span>Website</span><input name="website" type="url" autoComplete="url" placeholder="https://" required /></label>
                    <label className="campaign-field-wide"><span>Amazon Storefront / ASIN Link</span><input name="asinUrl" type="url" inputMode="url" placeholder="https://amazon.com/…" required /></label>
                  </div>
                </section>

                <section className="campaign-form-section" aria-labelledby="guided-title">
                  <div className="campaign-form-section-heading">
                    <span>02</span>
                    <div><h3 id="guided-title">ASIN Christmas Pilot guided input</h3><p>Five inputs that help us assess timing, fit, and pilot scope.</p></div>
                  </div>
                  <MultiSelect legend="ASIN Q1 — What type of Amazon holiday product are you planning?" options={productTypes} selected={productSelection} error={selectionErrors.product} onToggle={(option) => { toggle(option, productSelection, setProductSelection); setSelectionErrors((current) => ({ ...current, product: false })) }} />
                  <MultiSelect legend="ASIN Q2 — What are you planning this Amazon Christmas campaign for?" options={campaignGoals} selected={goalSelection} error={selectionErrors.goal} onToggle={(option) => { toggle(option, goalSelection, setGoalSelection); setSelectionErrors((current) => ({ ...current, goal: false })) }} />
                  <SingleSelect legend="ASIN Q3 — How many FC Magnets do you plan to distribute?" name="distribution" options={distributionOptions} />
                  <SingleSelect legend="ASIN Q4 — When do you need to receive the FC Magnets?" name="delivery" options={deliveryOptions} />
                  <SingleSelect legend="ASIN Q5 — What is your estimated budget per FC Magnet unit?" name="budget" options={budgetOptions} />
                </section>

                <button className="campaign-submit" type="submit">Apply &amp; Book</button>
                <p className="campaign-form-note">Your application is reviewed before the fit call. This page does not charge or place an order.</p>
              </form>
            </div>
          </section>

        </main>
      </div>
    </>
  )
}
