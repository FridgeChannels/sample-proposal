import { FormEvent, useState } from 'react'
import {
  buildCalendlyPrefillUrl,
  fetchAboutPilotFormToken,
  snFromSearchParams,
  submitAboutPilotApplication,
} from '../about-pilot/submitApplication'

const calendlyUrl = 'https://calendly.com/billy-fridgechannels/fridge-channel-pilot-meeting'

const businessGoals = [
  'Reach every household your products ship to, even through resellers',
  'Redirect reseller-driven customers to your Brand Storefront',
  'Own a zero-search path to the next purchase — not Amazon search or competitors',
  'Grow Amazon LTV through refills, bundles, and Subscribe & Save',
  'Own the customer relationship beyond Amazon, updatable anytime',
]

const unitBuckets = ['Under 100', '100–500', '501–2,000', '2,001–10,000', 'More than 10,000']

const sellerSituations = [
  'No — our brand is the only seller',
  'Yes — authorized distributors or resellers',
  'Yes — unauthorized sellers (if known)',
]

const brandRegistry = ['Yes', 'No', 'In progress / not sure']

const inserts = ['None', 'QR code insert', 'NFC / smart product insert', 'Other (describe)']

const fulfillmentOptions = [
  'Fulfilled by Amazon (FBA)',
  'Fulfilled directly by the brand (FBM)',
  'Fulfilled by a third-party logistics provider (3PL)',
]

type ProductLine = {
  asin: string
  unitMode: 'exact' | 'range' | ''
  exactUnits: string
  rangeUnits: string
}

const emptyProduct = (): ProductLine => ({ asin: '', unitMode: '', exactUnits: '', rangeUnits: '' })

function RequiredMark() {
  return <span className="asin-req" aria-hidden="true">*</span>
}

function toggleValue(values: string[], value: string, limit?: number) {
  if (values.includes(value)) return values.filter((item) => item !== value)
  if (limit && values.length >= limit) return values
  return [...values, value]
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function normalizeWebsite(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function Choice({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button className="asin-choice" type="button" aria-pressed={pressed} onClick={onClick}>
      <span className="asin-choice-mark" aria-hidden="true">{pressed ? '✓' : ''}</span>
      <span>{children}</span>
    </button>
  )
}

export function AsinApplyForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [website, setWebsite] = useState('')
  const [storefront, setStorefront] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [products, setProducts] = useState<ProductLine[]>([emptyProduct()])
  const [sellers, setSellers] = useState('')
  const [registry, setRegistry] = useState('')
  const [insertTypes, setInsertTypes] = useState<string[]>([])
  const [insertOther, setInsertOther] = useState('')
  const [manufacturing, setManufacturing] = useState('')
  const [fulfillment, setFulfillment] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const clearError = (key: string) => {
    setFieldErrors((current) => ({ ...current, [key]: false }))
  }

  const updateProduct = (index: number, patch: Partial<ProductLine>) => {
    setProducts((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
    clearError('products')
  }

  const toggleInsert = (option: string) => {
    setInsertTypes((current) => {
      if (option === 'None') return current.includes('None') ? [] : ['None']
      const withoutNone = current.filter((item) => item !== 'None')
      return toggleValue(withoutNone, option)
    })
  }

  const productsValid = products.some((product) => {
    const hasAsin = Boolean(product.asin.trim())
    const hasUnits = product.unitMode === 'exact'
      ? Boolean(product.exactUnits.trim())
      : product.unitMode === 'range' && Boolean(product.rangeUnits)
    return hasAsin && hasUnits
  })

  const validateAll = () => {
    const next = {
      fullName: fullName.trim().length < 2,
      email: !isEmail(email.trim()),
      title: !title.trim(),
      website: !normalizeWebsite(website),
      storefront: !normalizeWebsite(storefront),
      goals: goals.length === 0,
      products: !productsValid,
      sellers: !sellers,
      registry: !registry,
      inserts: insertTypes.includes('Other (describe)') && !insertOther.trim(),
      fulfillment: fulfillment.length === 0,
    }
    setFieldErrors(next)
    return !Object.values(next).some(Boolean)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError('')
    if (!validateAll()) {
      setSubmitError('Please complete the required fields.')
      event.currentTarget.querySelector<HTMLElement>('[aria-invalid="true"]')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center',
      })
      return
    }
    setSubmitting(true)
    try {
      const formToken = await fetchAboutPilotFormToken()
      await submitAboutPilotApplication({
        channel: 'Amazon',
        fullName: fullName.trim(),
        title: title.trim(),
        email: email.trim(),
        website: normalizeWebsite(website),
        magnetSn: snFromSearchParams(),
        amazonStorefront: normalizeWebsite(storefront),
        businessGoals: goals,
        products: products
          .filter((product) => product.asin.trim() && product.unitMode)
          .map((product) => ({
            asin: product.asin.trim(),
            unitMode: product.unitMode as 'exact' | 'range',
            exactUnits: product.exactUnits.trim() || undefined,
            rangeUnits: product.rangeUnits || undefined,
          })),
        otherSellers: sellers,
        brandRegistry: registry,
        packageInserts: insertTypes,
        insertOther: insertOther.trim() || undefined,
        manufacturingLocation: manufacturing.trim() || undefined,
        amazonFulfillment: fulfillment,
        formToken,
      })
      const nextUrl = buildCalendlyPrefillUrl(calendlyUrl, {
        fullName: fullName.trim(),
        email: email.trim(),
      })
      const dest = window.top ?? window
      dest.location.assign(nextUrl)
    } catch (error) {
      setSubmitting(false)
      setSubmitError(error instanceof Error ? error.message : "We couldn't save your application. Please try again.")
    }
  }

  return (
    <section className="asin-apply asin-slide" aria-labelledby="asin-apply-title">
      <form className="asin-apply__form asin-reveal" onSubmit={handleSubmit} noValidate>
        <header className="asin-apply__hero">
          <h2 id="asin-apply-title">Book a meeting</h2>
        </header>

        <div className="asin-apply__grid" aria-labelledby="asin-apply-title">
          <label className="asin-field" aria-invalid={fieldErrors.fullName || undefined}>
            <span>Full name<RequiredMark /></span>
            <input name="fullName" type="text" autoComplete="name" placeholder="Your name" value={fullName} onChange={(event) => { setFullName(event.target.value); clearError('fullName') }} />
          </label>
          <label className="asin-field" aria-invalid={fieldErrors.email || undefined}>
            <span>Work email<RequiredMark /></span>
            <input name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@brand.com" value={email} onChange={(event) => { setEmail(event.target.value); clearError('email') }} />
          </label>
          <label className="asin-field" aria-invalid={fieldErrors.title || undefined}>
            <span>Title<RequiredMark /></span>
            <input name="title" type="text" autoComplete="organization-title" placeholder="Your role" value={title} onChange={(event) => { setTitle(event.target.value); clearError('title') }} />
          </label>
          <label className="asin-field" aria-invalid={fieldErrors.website || undefined}>
            <span>Brand website<RequiredMark /></span>
            <input name="website" type="url" inputMode="url" autoComplete="url" placeholder="brand.com" value={website} onChange={(event) => { setWebsite(event.target.value); clearError('website') }} onBlur={() => setWebsite((current) => normalizeWebsite(current) || current)} />
          </label>
          <label className="asin-field asin-field--wide" aria-invalid={fieldErrors.storefront || undefined}>
            <span>Amazon Storefront URL<RequiredMark /></span>
            <input name="storefront" type="url" inputMode="url" placeholder="https://www.amazon.com/stores/..." value={storefront} onChange={(event) => { setStorefront(event.target.value); clearError('storefront') }} onBlur={() => setStorefront((current) => normalizeWebsite(current) || current)} />
          </label>
        </div>

        <fieldset className="asin-question" aria-invalid={fieldErrors.goals || undefined}>
          <legend><span className="asin-question-number" aria-hidden="true">01</span><span className="asin-question-label">Select up to 3 primary goals for FC to help you achieve<RequiredMark /></span></legend>
          <div className="asin-choice-list">
            {businessGoals.map((goal) => (
              <Choice key={goal} pressed={goals.includes(goal)} onClick={() => { setGoals((current) => toggleValue(current, goal, 3)); clearError('goals') }}>{goal}</Choice>
            ))}
          </div>
        </fieldset>

        <fieldset className="asin-question" aria-invalid={fieldErrors.products || undefined}>
          <legend><span className="asin-question-number" aria-hidden="true">02</span><span className="asin-question-label">Primary products / ASIN (up to 5)<RequiredMark /></span></legend>
          <p className="asin-apply__hint">Please list each product as one line so we can match metrics correctly.</p>
          <div className="asin-product-list">
            {products.map((product, index) => (
              <div className="asin-product" key={index}>
                <label className="asin-field">
                  <span>ASIN or Product URL</span>
                  <input type="text" placeholder="B0XXXXXXX or Amazon product URL" value={product.asin} onChange={(event) => updateProduct(index, { asin: event.target.value })} />
                </label>
                <div className="asin-units">
                  <p>Avg monthly units sold</p>
                  <div className="asin-choice-list asin-choice-list--split">
                    <Choice pressed={product.unitMode === 'exact'} onClick={() => updateProduct(index, { unitMode: 'exact', rangeUnits: '' })}>Exact number</Choice>
                    <Choice pressed={product.unitMode === 'range'} onClick={() => updateProduct(index, { unitMode: 'range', exactUnits: '' })}>Range bucket</Choice>
                  </div>
                  {product.unitMode === 'exact' && (
                    <input className="asin-units-input" type="number" inputMode="numeric" min="0" placeholder="e.g. 1200" value={product.exactUnits} onChange={(event) => updateProduct(index, { exactUnits: event.target.value })} />
                  )}
                  {product.unitMode === 'range' && (
                    <div className="asin-choice-list">
                      {unitBuckets.map((bucket) => (
                        <Choice key={bucket} pressed={product.rangeUnits === bucket} onClick={() => updateProduct(index, { rangeUnits: bucket })}>{bucket}</Choice>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {products.length < 5 && (
            <button className="asin-add-product" type="button" onClick={() => setProducts((current) => [...current, emptyProduct()])}>
              + Add another product
            </button>
          )}
        </fieldset>

        <fieldset className="asin-question" aria-invalid={fieldErrors.sellers || undefined}>
          <legend><span className="asin-question-number" aria-hidden="true">03</span><span className="asin-question-label">Are other sellers currently selling your products on Amazon?<RequiredMark /></span></legend>
          <div className="asin-choice-list">
            {sellerSituations.map((option) => (
              <Choice key={option} pressed={sellers === option} onClick={() => { setSellers(option); clearError('sellers') }}>{option}</Choice>
            ))}
          </div>
        </fieldset>

        <fieldset className="asin-question" aria-invalid={fieldErrors.registry || undefined}>
          <legend><span className="asin-question-number" aria-hidden="true">04</span><span className="asin-question-label">Are you enrolled in Amazon Brand Registry?<RequiredMark /></span></legend>
          <div className="asin-choice-list asin-choice-list--split">
            {brandRegistry.map((option) => (
              <Choice key={option} pressed={registry === option} onClick={() => { setRegistry(option); clearError('registry') }}>{option}</Choice>
            ))}
          </div>
        </fieldset>

        <fieldset className="asin-question" aria-invalid={fieldErrors.inserts || undefined}>
          <legend><span className="asin-question-number" aria-hidden="true">05</span><span className="asin-question-label">Do you currently use package inserts (QR / NFC / other)?</span></legend>
          <div className="asin-choice-list">
            {inserts.map((option) => (
              <Choice key={option} pressed={insertTypes.includes(option)} onClick={() => toggleInsert(option)}>{option}</Choice>
            ))}
          </div>
          {insertTypes.includes('Other (describe)') && (
            <label className="asin-field">
              <span>Describe the insert<RequiredMark /></span>
              <input type="text" value={insertOther} onChange={(event) => { setInsertOther(event.target.value); clearError('inserts') }} placeholder="What insert do you use today?" />
            </label>
          )}
        </fieldset>

        <fieldset className="asin-question">
          <legend><span className="asin-question-number" aria-hidden="true">06</span><span className="asin-question-label">Where are your products manufactured or packaged?</span></legend>
          <p className="asin-apply__hint">FC magnets are inserted during the product manufacturing or packaging stage. Please provide the country/region.</p>
          <label className="asin-field">
            <span className="sr-only">Manufacturing or packaging location</span>
            <textarea name="manufacturing" rows={1} placeholder="Country / region, facility or partner" value={manufacturing} onChange={(event) => { setManufacturing(event.target.value); clearError('manufacturing') }} />
          </label>
        </fieldset>

        <fieldset className="asin-question" aria-invalid={fieldErrors.fulfillment || undefined}>
          <legend><span className="asin-question-number" aria-hidden="true">07</span><span className="asin-question-label">How are your Amazon orders fulfilled?<RequiredMark /></span></legend>
          <div className="asin-choice-list">
            {fulfillmentOptions.map((option) => (
              <Choice key={option} pressed={fulfillment.includes(option)} onClick={() => { setFulfillment((current) => toggleValue(current, option)); clearError('fulfillment') }}>{option}</Choice>
            ))}
          </div>
        </fieldset>

        {submitError && <p className="asin-apply__error" role="alert">{submitError}</p>}

        <div className="asin-apply__dock">
          <button className="asin-button" type="submit" disabled={submitting}>
            {submitting ? 'Saving & opening calendar…' : 'Apply & Book a meeting'}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>
    </section>
  )
}
