import { useEffect, useRef, useState } from 'react'
import { orderTotal, readApiJson, resolvedLineItems, SHIPPING_OPTIONS } from '../config'
import type { BillingDetails, OrderState, PaymentMethod, ShippingAddress } from '../types'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const number = new Intl.NumberFormat('en-US')
const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

const paymentMethodLabels: Record<PaymentMethod, string> = {
  ach: 'ACH bank transfer',
  bank_transfer: 'Bank transfer',
  card: 'Credit card',
}

const LEGAL_DOCS = [
  { label: 'Order Summary', href: '/legal/actual-order-summary.html' },
  { label: 'Pilot Order & Service Terms', href: '/legal/pilot-order-service-terms.html' },
  { label: 'Data Processing Addendum', href: '/legal/data-processing-addendum.html' },
] as const

const US_STATE_OPTIONS = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
  ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
  ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
  ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
  ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
] as const

function isUnitedStatesCountry(value: string) {
  return ['us', 'usa', 'united states', 'united states of america'].includes(value.trim().toLowerCase())
}

function normalizedUsStateCode(value: string) {
  const normalized = value.trim().toLowerCase()
  return US_STATE_OPTIONS.find(([code, name]) =>
    code.toLowerCase() === normalized || name.toLowerCase() === normalized,
  )?.[0] || ''
}

type AddressSuggestion = {
  placeId: string
  mainText: string
  secondaryText: string
}

type ResolvedPlaceAddress = Pick<
  ShippingAddress,
  'addressLine1' | 'addressLine2' | 'city' | 'state' | 'postalCode' | 'country'
>

type RequiredShippingField = 'firstName' | 'lastName' | 'addressLine1' | 'city' | 'state' | 'postalCode' | 'country' | 'phone'
type RequiredBillingField = 'companyName' | 'address' | 'contactName' | 'jobTitle' | 'email'

const REQUIRED_SHIPPING_FIELDS: RequiredShippingField[] = [
  'firstName',
  'lastName',
  'addressLine1',
  'city',
  'state',
  'postalCode',
  'country',
  'phone',
]

const REQUIRED_BILLING_FIELDS: RequiredBillingField[] = [
  'companyName',
  'address',
  'contactName',
  'jobTitle',
  'email',
]

function shippingFieldError(field: RequiredShippingField, value: string, country: string) {
  const trimmed = value.trim()
  const requiredMessages: Record<RequiredShippingField, string> = {
    firstName: 'Enter a first name.',
    lastName: 'Enter a last name.',
    addressLine1: 'Enter a street address.',
    city: 'Enter a city.',
    state: 'Enter a state.',
    postalCode: 'Enter a ZIP code.',
    country: 'Enter a country.',
    phone: 'Enter a phone number.',
  }
  if (!trimmed) return requiredMessages[field]

  const isUnitedStates = isUnitedStatesCountry(country)
  if (field === 'state' && isUnitedStates && !normalizedUsStateCode(trimmed)) {
    return 'Select a valid state.'
  }
  if (field === 'postalCode' && isUnitedStates && !/^\d{5}(?:-\d{4})?$/.test(trimmed)) {
    return 'Enter a valid ZIP code.'
  }
  if (field === 'phone') {
    const digits = trimmed.replace(/\D/g, '')
    if (digits.length < 7 || digits.length > 15) return 'Enter a valid phone number.'
  }
  return ''
}

function billingFieldError(field: RequiredBillingField, value: string) {
  const trimmed = value.trim()
  const requiredMessages: Record<RequiredBillingField, string> = {
    companyName: 'Enter the company name.',
    address: 'Enter the company registered address.',
    contactName: 'Enter the signatory name.',
    jobTitle: 'Enter the signatory job title.',
    email: 'Enter a corporate email.',
  }
  if (!trimmed) return requiredMessages[field]
  if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Enter a valid corporate email.'
  }
  return ''
}

function nameParts(address: ShippingAddress) {
  const legacyParts = address.recipientName.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: address.firstName?.trim() || legacyParts[0] || '',
    lastName: address.lastName?.trim() || legacyParts.slice(1).join(' ') || '',
  }
}

export function FinanceView({
  order,
  magnetSn,
  now,
  onChange,
  onBack,
  onHome,
  externalHandoff = false,
}: {
  order: OrderState
  magnetSn: string
  now: number
  onChange?: (order: OrderState) => void
  onBack: () => void
  onHome: () => void
  externalHandoff?: boolean
}) {
  const total = orderTotal(order, now)
  const isPaid = order.status === 'paid' || order.financeHandoff?.status === 'paid'
  const previewEmptyShipping = import.meta.env.DEV && new URLSearchParams(window.location.search).get('previewAddress') === 'empty'
  const displayedShipping = previewEmptyShipping
    ? { firstName: '', lastName: '', recipientName: '', companyName: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: '', phone: '', email: '' }
    : order.shippingAddress
  const displayedName = nameParts(displayedShipping)
  const usesUsStateList = isUnitedStatesCountry(displayedShipping.country)
  const displayedUsState = normalizedUsStateCode(displayedShipping.state)
  const selectedShipping = SHIPPING_OPTIONS.air
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [receiptDownloading, setReceiptDownloading] = useState(false)
  const [receiptError, setReceiptError] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [addressSearching, setAddressSearching] = useState(false)
  const [addressResolving, setAddressResolving] = useState(false)
  const [addressNotice, setAddressNotice] = useState('')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [touchedShippingFields, setTouchedShippingFields] = useState<Partial<Record<RequiredShippingField, boolean>>>({})
  const [touchedBillingFields, setTouchedBillingFields] = useState<Partial<Record<RequiredBillingField, boolean>>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const placesSessionToken = useRef(crypto.randomUUID())
  const skipNextAutocomplete = useRef(false)
  const shippingValues: Record<RequiredShippingField, string> = {
    firstName: displayedName.firstName,
    lastName: displayedName.lastName,
    addressLine1: displayedShipping.addressLine1,
    city: displayedShipping.city,
    state: displayedShipping.state,
    postalCode: displayedShipping.postalCode,
    country: displayedShipping.country,
    phone: displayedShipping.phone || '',
  }
  const shippingErrors = Object.fromEntries(
    REQUIRED_SHIPPING_FIELDS.map((field) => [
      field,
      shippingFieldError(field, shippingValues[field], displayedShipping.country),
    ]),
  ) as Record<RequiredShippingField, string>
  const completedShippingFields = REQUIRED_SHIPPING_FIELDS.filter((field) => !shippingErrors[field]).length
  const remainingShippingFields = REQUIRED_SHIPPING_FIELDS.length - completedShippingFields
  const shippingComplete = remainingShippingFields === 0

  const billingValues: Record<RequiredBillingField, string> = {
    companyName: order.billing.companyName || '',
    address: order.billing.address || '',
    contactName: order.billing.contactName || '',
    jobTitle: order.billing.jobTitle || '',
    email: order.billing.email || '',
  }
  const billingErrors = Object.fromEntries(
    REQUIRED_BILLING_FIELDS.map((field) => [
      field,
      billingFieldError(field, billingValues[field]),
    ]),
  ) as Record<RequiredBillingField, string>
  const completedBillingFields = REQUIRED_BILLING_FIELDS.filter((field) => !billingErrors[field]).length
  const remainingBillingFields = REQUIRED_BILLING_FIELDS.length - completedBillingFields
  const billingComplete = remainingBillingFields === 0
  const checkoutComplete = shippingComplete && billingComplete
  const remainingCheckoutFields = remainingShippingFields + remainingBillingFields

  const markShippingFieldTouched = (field: RequiredShippingField) => {
    setTouchedShippingFields((current) => ({ ...current, [field]: true }))
  }

  const markBillingFieldTouched = (field: RequiredBillingField) => {
    setTouchedBillingFields((current) => ({ ...current, [field]: true }))
  }

  const showShippingFieldError = (field: RequiredShippingField) =>
    Boolean(shippingErrors[field] && (touchedShippingFields[field] || submitAttempted))

  const showShippingFieldValid = (field: RequiredShippingField) =>
    Boolean(shippingValues[field].trim() && !shippingErrors[field] && (touchedShippingFields[field] || submitAttempted))

  const showBillingFieldError = (field: RequiredBillingField) =>
    Boolean(billingErrors[field] && (touchedBillingFields[field] || submitAttempted))

  const showBillingFieldValid = (field: RequiredBillingField) =>
    Boolean(billingValues[field].trim() && !billingErrors[field] && (touchedBillingFields[field] || submitAttempted))

  const shippingFieldClass = (field: RequiredShippingField, baseClass = '') =>
    `${baseClass}${baseClass ? ' ' : ''}shipping-feedback-field${showShippingFieldError(field) ? ' has-error' : ''}${showShippingFieldValid(field) ? ' is-valid' : ''}`

  const billingFieldClass = (field: RequiredBillingField, baseClass = '') =>
    `${baseClass}${baseClass ? ' ' : ''}shipping-feedback-field${showBillingFieldError(field) ? ' has-error' : ''}${showBillingFieldValid(field) ? ' is-valid' : ''}`

  const focusFirstCheckoutError = () => {
    const firstInvalidBilling = REQUIRED_BILLING_FIELDS.find((field) => billingErrors[field])
    if (firstInvalidBilling) {
      const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-billing-field="${firstInvalidBilling}"]`)
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      window.setTimeout(() => input?.focus({ preventScroll: true }), 280)
      return
    }
    const firstInvalidShipping = REQUIRED_SHIPPING_FIELDS.find((field) => shippingErrors[field])
    if (!firstInvalidShipping) return
    const input = document.querySelector<HTMLInputElement>(`[data-shipping-field="${firstInvalidShipping}"]`)
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(() => input?.focus({ preventScroll: true }), 280)
  }

  const updateShippingFields = (patch: Partial<ShippingAddress>) => {
    onChange?.({ ...order, shippingAddress: { ...order.shippingAddress, ...patch } })
  }

  const updateBillingFields = (patch: Partial<BillingDetails>) => {
    onChange?.({ ...order, billing: { ...order.billing, ...patch } })
  }

  const updateShipping = (field: keyof ShippingAddress, value: string) => {
    updateShippingFields({ [field]: value })
  }

  const updateBilling = (field: keyof BillingDetails, value: string) => {
    updateBillingFields({ [field]: value })
  }

  const updateRecipientName = (field: 'firstName' | 'lastName', value: string) => {
    const nextFirstName = field === 'firstName' ? value : displayedName.firstName
    const nextLastName = field === 'lastName' ? value : displayedName.lastName
    updateShippingFields({
      [field]: value,
      recipientName: `${nextFirstName} ${nextLastName}`.trim(),
    })
  }

  useEffect(() => {
    const input = displayedShipping.addressLine1.trim()
    if (skipNextAutocomplete.current) {
      skipNextAutocomplete.current = false
      return
    }
    if (input.length < 3) {
      setAddressSuggestions([])
      setSuggestionsOpen(false)
      setAddressNotice('')
      setAddressSearching(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setAddressSearching(true)
      setAddressNotice('')
      try {
        const params = new URLSearchParams({
          input,
          sessionToken: placesSessionToken.current,
          country: displayedShipping.country,
        })
        const response = await fetch(`/api/places/autocomplete?${params}`, { signal: controller.signal })
        const data = await response.json().catch(() => ({})) as {
          suggestions?: AddressSuggestion[]
          error?: string
          code?: string
        }
        if (!response.ok) {
          setAddressSuggestions([])
          setSuggestionsOpen(false)
          setAddressNotice(data.code === 'places_not_configured'
            ? 'Address suggestions need a Google Maps API key.'
            : 'Suggestions unavailable. Enter the address manually.')
          return
        }
        const nextSuggestions = Array.isArray(data.suggestions) ? data.suggestions : []
        setAddressSuggestions(nextSuggestions)
        setSuggestionsOpen(nextSuggestions.length > 0)
        setActiveSuggestion(-1)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setAddressSuggestions([])
        setSuggestionsOpen(false)
        setAddressNotice('Suggestions unavailable. Enter the address manually.')
      } finally {
        if (!controller.signal.aborted) setAddressSearching(false)
      }
    }, 320)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [displayedShipping.addressLine1, displayedShipping.country])

  const selectAddressSuggestion = async (suggestion: AddressSuggestion) => {
    setAddressResolving(true)
    setAddressNotice('')
    try {
      const params = new URLSearchParams({
        placeId: suggestion.placeId,
        sessionToken: placesSessionToken.current,
      })
      const response = await fetch(`/api/places/details?${params}`)
      const data = await response.json().catch(() => ({})) as { address?: ResolvedPlaceAddress; error?: string }
      if (!response.ok || !data.address) throw new Error(data.error || 'Unable to load that address.')

      skipNextAutocomplete.current = true
      updateShippingFields({
        ...data.address,
        addressLine2: data.address.addressLine2 || displayedShipping.addressLine2,
      })
      setTouchedShippingFields((current) => ({
        ...current,
        addressLine1: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      }))
      setAddressSuggestions([])
      setSuggestionsOpen(false)
      setActiveSuggestion(-1)
      placesSessionToken.current = crypto.randomUUID()
    } catch (error) {
      setAddressNotice(error instanceof Error ? error.message : 'Unable to load that address.')
    } finally {
      setAddressResolving(false)
    }
  }

  const handleAddressKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestionsOpen || addressSuggestions.length === 0) {
      if (event.key === 'ArrowDown' && addressSuggestions.length > 0) setSuggestionsOpen(true)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveSuggestion(current => (current + 1) % addressSuggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveSuggestion(current => current <= 0 ? addressSuggestions.length - 1 : current - 1)
    } else if (event.key === 'Enter' && activeSuggestion >= 0) {
      event.preventDefault()
      void selectAddressSuggestion(addressSuggestions[activeSuggestion])
    } else if (event.key === 'Escape') {
      setSuggestionsOpen(false)
    }
  }

  const payWithStripeInvoice = async () => {
    if (!magnetSn || !order.dbOrderId) {
      setPayError('Order is not ready for payment.')
      return
    }
    if (!checkoutComplete) {
      setSubmitAttempted(true)
      setPayError('')
      window.requestAnimationFrame(focusFirstCheckoutError)
      return
    }
    if (!termsAccepted) {
      setPayError('Please review and check the box to agree before continuing to payment.')
      return
    }

    const billingPayload: BillingDetails = {
      companyName: (order.billing.companyName || '').trim(),
      address: (order.billing.address || '').trim(),
      contactName: (order.billing.contactName || '').trim(),
      jobTitle: (order.billing.jobTitle || '').trim(),
      email: (order.billing.email || '').trim(),
      poNumber: (order.billing.poNumber || '').trim(),
    }
    const shippingPayload = {
      ...displayedShipping,
      email: billingPayload.email,
      companyName: billingPayload.companyName,
    }

    setPaying(true)
    setPayError('')
    try {
      const addressResponse = await fetch('/api/pilot-orders/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sn: magnetSn,
          address: shippingPayload,
        }),
      })
      const addressData = await readApiJson<{ address: { id: number } }>(
        addressResponse,
        'Unable to save shipping address.',
      )

      const shippingResponse = await fetch('/api/pilot-orders/shipping', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.dbOrderId,
          shippingAddressId: addressData.address.id,
          billing: billingPayload,
        }),
      })
      await readApiJson(shippingResponse, 'Unable to link shipping address.')

      onChange?.({
        ...order,
        billing: billingPayload,
        shippingAddress: shippingPayload,
        shippingAddressId: addressData.address.id,
      })

      const invoiceResponse = await fetch('/api/stripe/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.dbOrderId,
          handoffToken: order.financeHandoff?.token,
          payerName: billingPayload.contactName || shippingPayload.recipientName,
        }),
      })
      const invoiceData = await readApiJson<{ hostedInvoiceUrl?: string }>(
        invoiceResponse,
        'Unable to create Stripe invoice.',
      )

      if (invoiceData.hostedInvoiceUrl) {
        window.location.assign(invoiceData.hostedInvoiceUrl)
        return
      }
      throw new Error('Stripe invoice URL was not returned.')
    } catch (error) {
      setPayError(error instanceof Error ? error.message : 'Unable to start payment.')
    } finally {
      setPaying(false)
    }
  }

  const downloadReceipt = async () => {
    const token = order.financeHandoff?.token
    if (!token) {
      setReceiptError('Receipt download is unavailable for this order.')
      return
    }

    setReceiptDownloading(true)
    setReceiptError('')
    try {
      const response = await fetch(`/api/finance-handoffs/${encodeURIComponent(token)}/receipt.pdf`)
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error || 'Unable to download receipt.')
      }
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `receipt-${order.orderNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (error) {
      setReceiptError(error instanceof Error ? error.message : 'Unable to download receipt.')
    } finally {
      setReceiptDownloading(false)
    }
  }

  if (!isPaid) return (
    <main className="finance-shell payment-shell">
      <header className="finance-header"><div className="brand-mark"><span>FC</span><strong>FridgeChannel</strong></div></header>
      <section className="invoice-hero">
        <div><h1>Order #{order.orderNumber}</h1></div>
      </section>
      <div className="finance-layout">
        <div className="finance-main">
          <section className="finance-section summary-section">
            <div className="section-heading"><h2>Order summary</h2></div>
            <div className="invoice-package"><div><span>Package</span><strong>{order.package.name}</strong></div><div><span>Quantity</span><strong>{number.format(order.quantity)} magnets</strong></div></div>
            <p className="invoice-package-description">{order.package.description}</p>
            <details className="finance-services-details">
              <summary>
                <span>Products & included services</span>
                <svg className="finance-details-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </summary>
              <div className="finance-service-groups">
                {order.package.includedServices.map((group) => (
                  <div key={group.title}>
                    <h3>{group.title}</h3>
                    <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                ))}
              </div>
            </details>
            <div className="line-items compact-line-items">
              {resolvedLineItems(order, now).map((item) => <div key={item.id}><div><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</div><b className={item.kind === 'discount' ? 'discount' : ''}>{item.amount < 0 ? `−${money.format(Math.abs(item.amount))}` : money.format(item.amount)}</b></div>)}
              <div><div><strong>Shipping · {selectedShipping.label}</strong><small>{selectedShipping.eta}</small></div><b>{money.format(selectedShipping.fee)}</b></div>
              <details className="shipping-fee-details">
                <summary>What’s included in shipping?</summary>
                <p>Door-to-door delivery from our warehouse in China to your confirmed U.S. address. The shipping fee includes transportation, customs clearance, applicable import duties and taxes, and final-mile delivery. Under normal circumstances, no additional import-related charges are expected upon receipt.</p>
              </details>
              <div className="line-total"><div><strong>Amount due</strong></div><b>{money.format(total)}</b></div>
            </div>
          </section>
          <section className="finance-section billing-section">
            <div className="section-heading">
              <div>
                <h2>Company & signatory</h2>
                <p>Legal company details used for the pilot order and service terms.</p>
                <p className="required-fields-note">Fields marked * are required.</p>
              </div>
              <span className={`shipping-completion${billingComplete ? ' is-complete' : ''}`}>
                {billingComplete ? 'Complete ✓' : `${completedBillingFields} of ${REQUIRED_BILLING_FIELDS.length} complete`}
              </span>
            </div>
            <div className="finance-shipping-form finance-billing-form form-grid">
              <label className={billingFieldClass('companyName', 'full-field')}>
                <span>Company name <b aria-hidden="true">*</b></span>
                <input
                  data-billing-field="companyName"
                  autoComplete="organization"
                  placeholder="Legal company name"
                  required
                  aria-invalid={showBillingFieldError('companyName')}
                  aria-describedby="billing-company-name-error"
                  value={order.billing.companyName || ''}
                  onBlur={() => markBillingFieldTouched('companyName')}
                  onChange={(event) => updateBilling('companyName', event.target.value)}
                />
                {showBillingFieldValid('companyName') && <i className="shipping-valid-icon" aria-label="Company name complete">✓</i>}
                {showBillingFieldError('companyName') && <small id="billing-company-name-error" className="field-error">{billingErrors.companyName}</small>}
              </label>
              <label className={billingFieldClass('address', 'full-field')}>
                <span>Company registered address <b aria-hidden="true">*</b></span>
                <textarea
                  data-billing-field="address"
                  autoComplete="street-address"
                  rows={3}
                  placeholder="Registered / legal address"
                  required
                  aria-invalid={showBillingFieldError('address')}
                  aria-describedby="billing-address-error"
                  value={order.billing.address || ''}
                  onBlur={() => markBillingFieldTouched('address')}
                  onChange={(event) => updateBilling('address', event.target.value)}
                />
                {showBillingFieldValid('address') && <i className="shipping-valid-icon" aria-label="Registered address complete">✓</i>}
                {showBillingFieldError('address') && <small id="billing-address-error" className="field-error">{billingErrors.address}</small>}
              </label>
              <label className={billingFieldClass('contactName')}>
                <span>Signatory name <b aria-hidden="true">*</b></span>
                <input
                  data-billing-field="contactName"
                  autoComplete="name"
                  placeholder="Full name"
                  required
                  aria-invalid={showBillingFieldError('contactName')}
                  aria-describedby="billing-contact-name-error"
                  value={order.billing.contactName || ''}
                  onBlur={() => markBillingFieldTouched('contactName')}
                  onChange={(event) => updateBilling('contactName', event.target.value)}
                />
                {showBillingFieldValid('contactName') && <i className="shipping-valid-icon" aria-label="Signatory name complete">✓</i>}
                {showBillingFieldError('contactName') && <small id="billing-contact-name-error" className="field-error">{billingErrors.contactName}</small>}
              </label>
              <label className={billingFieldClass('jobTitle')}>
                <span>Job title <b aria-hidden="true">*</b></span>
                <input
                  data-billing-field="jobTitle"
                  autoComplete="organization-title"
                  placeholder="Title / role"
                  required
                  aria-invalid={showBillingFieldError('jobTitle')}
                  aria-describedby="billing-job-title-error"
                  value={order.billing.jobTitle || ''}
                  onBlur={() => markBillingFieldTouched('jobTitle')}
                  onChange={(event) => updateBilling('jobTitle', event.target.value)}
                />
                {showBillingFieldValid('jobTitle') && <i className="shipping-valid-icon" aria-label="Job title complete">✓</i>}
                {showBillingFieldError('jobTitle') && <small id="billing-job-title-error" className="field-error">{billingErrors.jobTitle}</small>}
              </label>
              <label className={billingFieldClass('email', 'full-field')}>
                <span>Corporate email <b aria-hidden="true">*</b></span>
                <input
                  data-billing-field="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="name@company.com"
                  required
                  aria-invalid={showBillingFieldError('email')}
                  aria-describedby="billing-email-error"
                  value={order.billing.email || ''}
                  onBlur={() => markBillingFieldTouched('email')}
                  onChange={(event) => updateBilling('email', event.target.value)}
                />
                {showBillingFieldValid('email') && <i className="shipping-valid-icon" aria-label="Corporate email complete">✓</i>}
                {showBillingFieldError('email') && <small id="billing-email-error" className="field-error">{billingErrors.email}</small>}
              </label>
            </div>
          </section>
          <section className="finance-section shipping-section">
            <div className="section-heading">
              <div><h2>Shipping address</h2><p>Enter the delivery contact and location for the {number.format(order.quantity)} pilot magnets.</p><p className="required-fields-note">Fields marked * are required.</p></div>
              <span className={`shipping-completion${shippingComplete ? ' is-complete' : ''}`}>{shippingComplete ? 'Complete ✓' : `${completedShippingFields} of ${REQUIRED_SHIPPING_FIELDS.length} complete`}</span>
            </div>
            <div className="finance-shipping-form form-grid">
              <label className={shippingFieldClass('firstName', 'shipping-first-name')}><span>Contact first name <b aria-hidden="true">*</b></span><input data-shipping-field="firstName" autoComplete="shipping given-name" placeholder="First name" required aria-invalid={showShippingFieldError('firstName')} aria-describedby="shipping-first-name-error" value={displayedName.firstName} onBlur={() => markShippingFieldTouched('firstName')} onChange={(event) => updateRecipientName('firstName', event.target.value)} />{showShippingFieldValid('firstName') && <i className="shipping-valid-icon" aria-label="First name complete">✓</i>}{showShippingFieldError('firstName') && <small id="shipping-first-name-error" className="field-error">{shippingErrors.firstName}</small>}</label>
              <label className={shippingFieldClass('lastName', 'shipping-last-name')}><span>Contact last name <b aria-hidden="true">*</b></span><input data-shipping-field="lastName" autoComplete="shipping family-name" placeholder="Last name" required aria-invalid={showShippingFieldError('lastName')} aria-describedby="shipping-last-name-error" value={displayedName.lastName} onBlur={() => markShippingFieldTouched('lastName')} onChange={(event) => updateRecipientName('lastName', event.target.value)} />{showShippingFieldValid('lastName') && <i className="shipping-valid-icon" aria-label="Last name complete">✓</i>}{showShippingFieldError('lastName') && <small id="shipping-last-name-error" className="field-error">{shippingErrors.lastName}</small>}</label>
              <div className={shippingFieldClass('addressLine1', 'full-field address-autocomplete')}>
                <label htmlFor="shipping-address-line-1"><span>Address line 1 <b aria-hidden="true">*</b></span>
                  <input
                    id="shipping-address-line-1"
                    data-shipping-field="addressLine1"
                    autoComplete="off"
                    placeholder="Start typing an address"
                    required
                    value={displayedShipping.addressLine1}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-invalid={showShippingFieldError('addressLine1')}
                    aria-describedby="shipping-address-line-1-error"
                    aria-expanded={suggestionsOpen}
                    aria-controls="shipping-address-suggestions"
                    aria-activedescendant={activeSuggestion >= 0 ? `shipping-address-suggestion-${activeSuggestion}` : undefined}
                    onChange={(event) => updateShipping('addressLine1', event.target.value)}
                    onFocus={() => addressSuggestions.length > 0 && setSuggestionsOpen(true)}
                    onBlur={() => {
                      markShippingFieldTouched('addressLine1')
                      window.setTimeout(() => setSuggestionsOpen(false), 120)
                    }}
                    onKeyDown={handleAddressKeyDown}
                  />
                </label>
                {showShippingFieldValid('addressLine1') && <i className="shipping-valid-icon" aria-label="Street address complete">✓</i>}
                {showShippingFieldError('addressLine1') && <small id="shipping-address-line-1-error" className="field-error">{shippingErrors.addressLine1}</small>}
                {addressSearching && <small className="address-search-status">Finding addresses…</small>}
                {addressNotice && <small className="address-search-status">{addressNotice}</small>}
                {suggestionsOpen && addressSuggestions.length > 0 && (
                  <div id="shipping-address-suggestions" className="address-suggestions" role="listbox">
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        id={`shipping-address-suggestion-${index}`}
                        key={suggestion.placeId}
                        type="button"
                        role="option"
                        aria-selected={activeSuggestion === index}
                        className={activeSuggestion === index ? 'is-active' : ''}
                        disabled={addressResolving}
                        onPointerDown={(event) => event.preventDefault()}
                        onClick={() => void selectAddressSuggestion(suggestion)}
                      >
                        <strong>{suggestion.mainText}</strong>
                        {suggestion.secondaryText && <span>{suggestion.secondaryText}</span>}
                      </button>
                    ))}
                    <span className="google-maps-attribution" translate="no">Google Maps</span>
                  </div>
                )}
              </div>
              <label className="full-field"><span>Address line 2 <em>(optional)</em></span><input autoComplete="shipping address-line2" placeholder="Apartment, suite, unit" value={displayedShipping.addressLine2} onChange={(event) => updateShipping('addressLine2', event.target.value)} /></label>
              <label className={shippingFieldClass('city', 'shipping-city')}><span>City <b aria-hidden="true">*</b></span><input data-shipping-field="city" autoComplete="shipping address-level2" required aria-invalid={showShippingFieldError('city')} aria-describedby="shipping-city-error" value={displayedShipping.city} onBlur={() => markShippingFieldTouched('city')} onChange={(event) => updateShipping('city', event.target.value)} />{showShippingFieldValid('city') && <i className="shipping-valid-icon" aria-label="City complete">✓</i>}{showShippingFieldError('city') && <small id="shipping-city-error" className="field-error">{shippingErrors.city}</small>}</label>
              <label className={shippingFieldClass('state', 'shipping-state')}>
                <span>State <b aria-hidden="true">*</b></span>
                {usesUsStateList ? (
                  <select
                    data-shipping-field="state"
                    autoComplete="shipping address-level1"
                    required
                    aria-invalid={showShippingFieldError('state')}
                    aria-describedby="shipping-state-error"
                    value={displayedUsState}
                    onBlur={() => markShippingFieldTouched('state')}
                    onChange={(event) => updateShipping('state', event.target.value)}
                  >
                    <option value="">Select state</option>
                    {US_STATE_OPTIONS.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
                  </select>
                ) : (
                  <input
                    data-shipping-field="state"
                    autoComplete="shipping address-level1"
                    required
                    aria-invalid={showShippingFieldError('state')}
                    aria-describedby="shipping-state-error"
                    value={displayedShipping.state}
                    onBlur={() => markShippingFieldTouched('state')}
                    onChange={(event) => updateShipping('state', event.target.value)}
                  />
                )}
                {showShippingFieldValid('state') && <i className="shipping-valid-icon" aria-label="State complete">✓</i>}
                {showShippingFieldError('state') && <small id="shipping-state-error" className="field-error">{shippingErrors.state}</small>}
              </label>
              <label className={shippingFieldClass('postalCode', 'shipping-zip')}><span>ZIP code <b aria-hidden="true">*</b></span><input data-shipping-field="postalCode" autoComplete="shipping postal-code" inputMode="numeric" placeholder="12345" required aria-invalid={showShippingFieldError('postalCode')} aria-describedby="shipping-postal-code-error" value={displayedShipping.postalCode} onBlur={() => markShippingFieldTouched('postalCode')} onChange={(event) => updateShipping('postalCode', event.target.value)} />{showShippingFieldValid('postalCode') && <i className="shipping-valid-icon" aria-label="ZIP code complete">✓</i>}{showShippingFieldError('postalCode') && <small id="shipping-postal-code-error" className="field-error">{shippingErrors.postalCode}</small>}</label>
              <label className={shippingFieldClass('country', 'shipping-country')}><span>Country <b aria-hidden="true">*</b></span><input data-shipping-field="country" autoComplete="shipping country-name" required aria-invalid={showShippingFieldError('country')} aria-describedby="shipping-country-error" value={displayedShipping.country} onBlur={() => markShippingFieldTouched('country')} onChange={(event) => updateShipping('country', event.target.value)} />{showShippingFieldValid('country') && <i className="shipping-valid-icon" aria-label="Country complete">✓</i>}{showShippingFieldError('country') && <small id="shipping-country-error" className="field-error">{shippingErrors.country}</small>}</label>
              <label className={shippingFieldClass('phone', 'shipping-phone')}><span>Phone <b aria-hidden="true">*</b></span><input data-shipping-field="phone" autoComplete="tel" inputMode="tel" placeholder="(555) 123-4567" required aria-invalid={showShippingFieldError('phone')} aria-describedby="shipping-phone-error" value={displayedShipping.phone || ''} onBlur={() => markShippingFieldTouched('phone')} onChange={(event) => updateShipping('phone', event.target.value)} />{showShippingFieldValid('phone') && <i className="shipping-valid-icon" aria-label="Phone complete">✓</i>}{showShippingFieldError('phone') && <small id="shipping-phone-error" className="field-error">{shippingErrors.phone}</small>}</label>
            </div>
          </section>
        </div>
        <aside className="finance-side">
          <section className="finance-section payment-section">
            <div className="section-heading"><h2>Payment</h2></div>
            <p className="invoice-package-description">Continue to Stripe’s secure payment page to complete this order. Invoice email is sent by Stripe after payment is ready.</p>
          </section>
          <div className="invoice-actions">
            <p className="eyebrow">Amount due</p><strong className="payment-total">{money.format(total)}</strong>
            {submitAttempted && !checkoutComplete && <p className="checkout-feedback is-error" role="alert">Complete {remainingCheckoutFields} required {remainingCheckoutFields === 1 ? 'field' : 'fields'} to continue.</p>}
            {checkoutComplete && <p className="checkout-feedback is-complete">✓ Company and shipping information complete</p>}
            <div className="plan-terms-agree">
              <label className="plan-terms-check">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => {
                    setTermsAccepted(event.target.checked)
                    if (event.target.checked) setPayError('')
                  }}
                />
                <span>
                  I have reviewed and agree to the{' '}
                  {LEGAL_DOCS.map((doc, index) => {
                    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash || '#finance'}`
                    const href = `${doc.href}?return=${encodeURIComponent(returnTo)}`
                    return (
                      <span key={doc.href}>
                        {index > 0 && (index === LEGAL_DOCS.length - 1 ? ', and ' : ', ')}
                        <a
                          href={href}
                          onClick={(event) => {
                            event.stopPropagation()
                            try {
                              window.sessionStorage.setItem('fc-order-summary-draft', JSON.stringify(order))
                            } catch {
                              // ignore quota / private mode failures; page still falls back to localStorage
                            }
                          }}
                        >
                          {doc.label}
                        </a>
                      </span>
                    )
                  })}
                  .
                </span>
              </label>
            </div>
            <button
              type="button"
              className="primary-action pay-invoice"
              disabled={paying || !termsAccepted}
              onClick={payWithStripeInvoice}
            >
              {paying ? 'Opening payment…' : 'Continue to payment'} <span>→</span>
            </button>
            {payError && <p className="backend-note">{payError}</p>}
            {!externalHandoff && <button type="button" className="text-button" onClick={onBack}>Back to order</button>}
          </div>
        </aside>
      </div>
    </main>
  )

  return (
    <main className="finance-shell receipt-shell">
      <header className="finance-header"><button type="button" className="brand-mark" onClick={onHome} aria-label="Back to Live"><span>FC</span><strong>FridgeChannel</strong></button><div className="approval-state is-approved"><span />Paid</div></header>

      <section className="invoice-hero receipt-hero">
        <div>
          <p className="eyebrow">RECEIPT</p>
          <h1>Receipt #{order.invoiceNumber}</h1>
          <p>Order #{order.orderNumber}</p>
          <p className="invoice-package-description">This pilot order has already been paid. No further payment is needed.</p>
        </div>
      </section>

      <div className="finance-layout receipt-layout">
        <div className="finance-main">
          <section className="finance-section receipt-shipping-section">
            <div className="section-heading"><h2>Current shipping status</h2></div>
            <div className="receipt-shipping-status">
              <span aria-hidden="true" />
              <div>
                <strong>Preparing for shipment</strong>
                <p>We’re preparing your order for shipment. Tracking information will be available once your order ships.</p>
              </div>
            </div>
          </section>

          <section className="finance-section summary-section">
            <div className="section-heading"><h2>Order details</h2></div>
            <div className="invoice-package"><div><span>Package</span><strong>{order.package.name}</strong></div><div><span>Quantity</span><strong>{number.format(order.quantity)} magnets</strong></div></div>
            <div className="line-items compact-line-items">
              {resolvedLineItems(order, now).map((item) => <div key={item.id}><div><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</div><b className={item.kind === 'discount' ? 'discount' : ''}>{item.amount < 0 ? `−${money.format(Math.abs(item.amount))}` : money.format(item.amount)}</b></div>)}
              <div><div><strong>Shipping · {selectedShipping.label}</strong><small>{selectedShipping.eta}</small></div><b>{money.format(selectedShipping.fee)}</b></div>
              <div className="line-total"><div><strong>Total paid</strong></div><b>{money.format(total)}</b></div>
            </div>
          </section>

          <section className="finance-section receipt-payment-section">
            <div className="section-heading"><h2>Payment information</h2></div>
            <dl className="receipt-details">
              <div><dt>Status</dt><dd>Paid</dd></div>
              <div><dt>Payment method</dt><dd>Stripe Invoice</dd></div>
              {order.paidAt && <div><dt>Paid on</dt><dd>{date.format(new Date(order.paidAt))}</dd></div>}
              <div><dt>Payment reference</dt><dd>{order.orderNumber}</dd></div>
            </dl>
          </section>

          {(order.billing.companyName || order.billing.contactName || order.billing.address || order.billing.email) && <section className="finance-section receipt-billing-section">
            <div className="section-heading"><h2>Company & signatory</h2></div>
            <dl className="receipt-details">
              {order.billing.companyName && <div><dt>Company</dt><dd>{order.billing.companyName}</dd></div>}
              {order.billing.address && <div><dt>Registered address</dt><dd>{order.billing.address}</dd></div>}
              {order.billing.contactName && <div><dt>Signatory</dt><dd>{order.billing.contactName}{order.billing.jobTitle ? ` · ${order.billing.jobTitle}` : ''}</dd></div>}
              {order.billing.email && <div><dt>Corporate email</dt><dd>{order.billing.email}</dd></div>}
              {order.billing.poNumber && <div><dt>PO number</dt><dd>{order.billing.poNumber}</dd></div>}
            </dl>
          </section>}
        </div>

        <aside className="invoice-actions receipt-actions">
          <a className="primary-action" href="https://dtc-dashboard.fridgechannels.com/">View order in Dashboard <span>→</span></a>
          <button type="button" className="secondary-action" disabled={receiptDownloading} aria-describedby={receiptError ? 'receipt-download-error' : undefined} onClick={() => void downloadReceipt()}>{receiptDownloading ? 'Downloading…' : 'Download receipt'} <span>↓</span></button>
          {receiptError && <p id="receipt-download-error" className="receipt-download-error" role="alert">{receiptError}</p>}
        </aside>
      </div>
    </main>
  )
}
