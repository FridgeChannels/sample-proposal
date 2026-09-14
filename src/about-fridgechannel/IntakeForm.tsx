import { FormEvent, useState } from 'react'
import { buildCalendlyPrefillUrl } from '../christmas-campaign/submitApplication'

const calendlyUrl = 'https://calendly.com/billy-fridgechannels/fridge-channel-pilot-meeting'
const OTHER = 'Other — please specify'

const retentionOutcomes = [
  'Increase customer lifetime value (LTV)',
  'Convert one-time buyers into subscribers',
  'Increase repeat purchases among existing customers',
  'Increase purchases of additional products among subscribers',
  'Increase customer engagement between purchases',
  OTHER,
]

const strategicGoals = [
  'Own a physical brand presence in the customer\'s home',
  'Own the path to the next purchase through your own channel, not Google, Amazon, or AI search',
  'Earn 10+ daily brand exposure without paying per impression',
  'Stay top of mind between purchases',
  'Re-engage customers without email, SMS, or paid ads',
]

const monthlyOrders = ['Under 100', '100–500', '501–2,000', '2,001–10,000', 'More than 10,000']
const averageOrderValues = ['Under US$25', 'US$25–49', 'US$50–99', 'US$100–199', 'US$200 or more']
const fulfillmentModels = [
  'In-house fulfillment and shipping',
  'Third-party logistics (3PL) fulfillment and shipping',
  'Hybrid fulfillment: in-house and 3PL',
  OTHER,
]
const insertCapabilities = ['Yes', 'No', 'Not sure', 'Not applicable']
const businessModels = [
  'Standard one-time purchase',
  'Subscription or recurring purchase',
  'Both one-time purchase and subscription',
  OTHER,
]
const subscriberCounts = ['Under 500', '501–2,000', '2,001–10,000', 'More than 10,000']

function RequiredMark() {
  return <span className="fc-required" aria-hidden="true">*</span>
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function normalizeWebsite(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function MultiSelect({
  number,
  legend,
  hint,
  options,
  selected,
  onToggle,
  error,
}: {
  number?: string
  legend: string
  hint: string
  options: string[]
  selected: string[]
  onToggle: (option: string) => void
  error: boolean
}) {
  return (
    <fieldset className="fc-question" aria-invalid={error} aria-required="true">
      <legend>
        {number && <span className="fc-question-number" aria-hidden="true">{number}</span>}
        <span className="fc-question-label">{legend}<RequiredMark /></span>
      </legend>
      <p className="fc-hint">{hint}</p>
      <div className="fc-choice-grid">
        {options.map((option) => {
          const active = selected.includes(option)
          return (
            <button
              className="fc-choice"
              type="button"
              key={option}
              aria-pressed={active}
              onClick={() => onToggle(option)}
            >
              <span className="fc-choice-mark" aria-hidden="true">{active ? '✓' : ''}</span>
              <span>{option}</span>
            </button>
          )
        })}
      </div>
      {error && <p className="fc-error" role="alert">Choose at least one option.</p>}
    </fieldset>
  )
}

function SingleSelect({
  number,
  legend,
  name,
  options,
  value,
  onChange,
  hint,
  error,
}: {
  number?: string
  legend: string
  name: string
  options: string[]
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: boolean
}) {
  return (
    <fieldset className="fc-question" aria-required="true" aria-invalid={error || undefined}>
      <legend>
        {number && <span className="fc-question-number" aria-hidden="true">{number}</span>}
        <span className="fc-question-label">{legend}<RequiredMark /></span>
      </legend>
      {hint && <p className="fc-hint">{hint}</p>}
      <div className="fc-radio-list">
        {options.map((option) => (
          <label className="fc-radio" key={option}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            <span className="fc-radio-dot" aria-hidden="true" />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {error && <p className="fc-error" role="alert">Please choose one option.</p>}
    </fieldset>
  )
}

export function IntakeForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [website, setWebsite] = useState('')
  const [retention, setRetention] = useState<string[]>([])
  const [strategic, setStrategic] = useState<string[]>([])
  const [retentionOther, setRetentionOther] = useState('')
  const [monthlyOrder, setMonthlyOrder] = useState('')
  const [aov, setAov] = useState('')
  const [fulfillment, setFulfillment] = useState('')
  const [fulfillmentOther, setFulfillmentOther] = useState('')
  const [insertCapability, setInsertCapability] = useState('')
  const [businessModel, setBusinessModel] = useState('')
  const [businessOther, setBusinessOther] = useState('')
  const [subscribers, setSubscribers] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const uses3pl = fulfillment.includes('3PL')
  const hasSubscription = businessModel.includes('Subscription') || businessModel.includes('Both')

  const clearError = (key: string) => {
    setFieldErrors((currentValue) => ({ ...currentValue, [key]: false }))
  }

  const validateAll = () => {
    const next = {
      fullName: fullName.trim().length < 2,
      email: !isEmail(email.trim()),
      title: !title.trim(),
      website: !normalizeWebsite(website),
      retention: retention.length === 0 || (retention.includes(OTHER) && !retentionOther.trim()),
      strategic: strategic.length === 0,
      monthlyOrder: !monthlyOrder,
      aov: !aov,
      fulfillment: !fulfillment || (fulfillment === OTHER && !fulfillmentOther.trim()),
      insertCapability: uses3pl && !insertCapability,
      businessModel: !businessModel || (businessModel === OTHER && !businessOther.trim()),
      subscribers: hasSubscription && !subscribers,
    }
    setFieldErrors(next)
    return !Object.values(next).some(Boolean)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError('')
    if (!validateAll()) {
      setSubmitError('Please complete the required fields.')
      const firstError = event.currentTarget.querySelector<HTMLElement>('[aria-invalid="true"]')
      firstError?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center',
      })
      return
    }

    setSubmitting(true)
    window.location.assign(
      buildCalendlyPrefillUrl(calendlyUrl, {
        fullName: fullName.trim(),
        email: email.trim(),
      }),
    )
  }

  return (
    <form className="fc-form" onSubmit={handleSubmit} noValidate>
      <header className="fc-intake-hero">
        <p className="fc-kicker">FridgeChannel intake</p>
        <h2 id="intake-title">Book a meeting</h2>
      </header>

      <section className="fc-section" aria-labelledby="intake-title">
        <label className="fc-specify">
          <span>Full name<RequiredMark /></span>
          <input
            name="fullName"
            type="text"
            autoComplete="name"
            enterKeyHint="next"
            placeholder="Your name"
            value={fullName}
            onChange={(event) => {
              setFullName(event.target.value)
              clearError('fullName')
            }}
            aria-invalid={fieldErrors.fullName || undefined}
          />
        </label>
        <label className="fc-specify">
          <span>Email<RequiredMark /></span>
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="next"
            placeholder="you@brand.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              clearError('email')
            }}
            aria-invalid={fieldErrors.email || undefined}
          />
        </label>
        <label className="fc-specify">
          <span>Title<RequiredMark /></span>
          <input
            name="title"
            type="text"
            autoComplete="organization-title"
            enterKeyHint="next"
            placeholder="Your role"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              clearError('title')
            }}
            aria-invalid={fieldErrors.title || undefined}
          />
        </label>
        <label className="fc-specify">
          <span>Company website<RequiredMark /></span>
          <input
            name="website"
            type="url"
            inputMode="url"
            autoComplete="url"
            enterKeyHint="done"
            placeholder="brand.com"
            value={website}
            onChange={(event) => {
              setWebsite(event.target.value)
              clearError('website')
            }}
            onBlur={() => setWebsite((currentValue) => normalizeWebsite(currentValue) || currentValue)}
            aria-invalid={fieldErrors.website || undefined}
          />
        </label>
        <MultiSelect
          number="01"
          legend="What customer retention outcomes do you want FC to help achieve?"
          hint="Multi-select"
          options={retentionOutcomes}
          selected={retention}
          error={Boolean(fieldErrors.retention)}
          onToggle={(option) => {
            setRetention((currentValue) => toggleValue(currentValue, option))
            clearError('retention')
          }}
        />
        {retention.includes(OTHER) && (
          <label className="fc-specify">
            <span>Please specify<RequiredMark /></span>
            <input
              type="text"
              enterKeyHint="done"
              value={retentionOther}
              onChange={(event) => setRetentionOther(event.target.value)}
              placeholder="The retention outcome you want"
            />
          </label>
        )}
        <MultiSelect
          legend="What strategic goals do you want FC to help you achieve?"
          number="02"
          hint="Multi-select"
          options={strategicGoals}
          selected={strategic}
          error={Boolean(fieldErrors.strategic)}
          onToggle={(option) => {
            setStrategic((currentValue) => toggleValue(currentValue, option))
            clearError('strategic')
          }}
        />
        <SingleSelect
          number="03"
          legend="How many orders do you receive through DTC each month?"
          name="monthlyOrders"
          options={monthlyOrders}
          value={monthlyOrder}
          onChange={(value) => {
            setMonthlyOrder(value)
            clearError('monthlyOrder')
          }}
          error={fieldErrors.monthlyOrder}
        />
        <SingleSelect
          number="04"
          legend="What is your average DTC order value? (USD)"
          name="aov"
          options={averageOrderValues}
          value={aov}
          onChange={(value) => {
            setAov(value)
            clearError('aov')
          }}
          error={fieldErrors.aov}
        />
        <SingleSelect
          number="05"
          legend="What is your DTC fulfillment model?"
          name="fulfillment"
          options={fulfillmentModels}
          value={fulfillment}
          onChange={(value) => {
            setFulfillment(value)
            if (!value.includes('3PL')) setInsertCapability('')
            clearError('fulfillment')
          }}
          error={fieldErrors.fulfillment}
        />
        {fulfillment === OTHER && (
          <label className="fc-specify">
            <span>Please specify<RequiredMark /></span>
            <input
              type="text"
              enterKeyHint="done"
              value={fulfillmentOther}
              onChange={(event) => setFulfillmentOther(event.target.value)}
              placeholder="Your fulfillment model"
            />
          </label>
        )}
        {uses3pl && (
          <SingleSelect
            number="06"
            legend="If you use a third-party logistics provider, can the provider insert additional materials into outgoing orders?"
            name="insertCapability"
            options={insertCapabilities}
            value={insertCapability}
            onChange={(value) => {
              setInsertCapability(value)
              clearError('insertCapability')
            }}
            error={fieldErrors.insertCapability}
          />
        )}
        <SingleSelect
          number="07"
          legend="Which business model best describes your DTC business?"
          name="businessModel"
          options={businessModels}
          value={businessModel}
          onChange={(value) => {
            setBusinessModel(value)
            if (!value.includes('Subscription') && !value.includes('Both')) setSubscribers('')
            clearError('businessModel')
          }}
          error={fieldErrors.businessModel}
        />
        {businessModel === OTHER && (
          <label className="fc-specify">
            <span>Please specify<RequiredMark /></span>
            <input
              type="text"
              enterKeyHint="done"
              value={businessOther}
              onChange={(event) => setBusinessOther(event.target.value)}
              placeholder="Your business model"
            />
          </label>
        )}
        {hasSubscription && (
          <SingleSelect
            number="08"
            legend="Approximately how many active subscribers do you currently have?"
            name="subscribers"
            options={subscriberCounts}
            value={subscribers}
            onChange={(value) => {
              setSubscribers(value)
              clearError('subscribers')
            }}
            error={fieldErrors.subscribers}
          />
        )}
      </section>

      {submitError && <p className="fc-error fc-error-global" role="alert">{submitError}</p>}

      <div className="fc-dock">
        <button className="fc-submit" type="submit" disabled={submitting}>
          <span>{submitting ? 'Opening calendar…' : 'Book a meeting'}</span>
          <b aria-hidden="true">→</b>
        </button>
      </div>
    </form>
  )
}
