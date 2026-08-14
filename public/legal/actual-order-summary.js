(function () {
  const STORAGE_LOCAL = 'fc-order-preview-v1'
  const STORAGE_DRAFT = 'fc-order-summary-draft'
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
  const number = new Intl.NumberFormat('en-US')

  const readJson = (raw) => {
    try {
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const loadOrder = () => {
    const draft = readJson(window.sessionStorage.getItem(STORAGE_DRAFT))
    if (draft && typeof draft === 'object') return draft
    const stored = readJson(window.localStorage.getItem(STORAGE_LOCAL))
    if (stored && typeof stored === 'object') return stored
    return null
  }

  const clean = (value) => String(value || '').trim()

  const joinParts = (parts, separator = ' / ') => parts.map(clean).filter(Boolean).join(separator)

  const formatAddress = (shipping = {}) => {
    const line = [
      clean(shipping.addressLine1),
      clean(shipping.addressLine2),
      [clean(shipping.city), clean(shipping.state), clean(shipping.postalCode)].filter(Boolean).join(', '),
      clean(shipping.country),
    ].filter(Boolean)
    return line.join('\n')
  }

  const formatContactName = (shipping = {}) => {
    const parts = [clean(shipping.firstName), clean(shipping.lastName)].filter(Boolean)
    if (parts.length) return parts.join(' ')
    return clean(shipping.recipientName)
  }

  const setValue = (id, value, placeholder) => {
    const el = document.getElementById(id)
    if (!el) return
    const text = clean(value)
    if (text) {
      el.textContent = text
      el.classList.remove('is-empty')
    } else {
      el.textContent = placeholder
      el.classList.add('is-empty')
    }
  }

  const shippingFeeFor = (order) => {
    if (order?.shippingMethod === 'ocean') return 200
    return 800
  }

  const productSubtotal = (order) => {
    const line = Array.isArray(order?.lineItems)
      ? order.lineItems.find((item) => item.id === 'magnets' || /magnet/i.test(item.label || ''))
      : null
    if (line && Number.isFinite(Number(line.amount))) return Number(line.amount)
    const quantity = Number(order?.quantity) || 0
    const unitPrice = Number(order?.unitPrice) || 0
    return quantity * unitPrice
  }

  const orderTotal = (order) => {
    const lines = Array.isArray(order?.lineItems)
      ? order.lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      : productSubtotal(order)
    const tax = Number(order?.tax) || 0
    return lines + shippingFeeFor(order) + tax
  }

  const fillDocument = () => {
    const order = loadOrder()
    const billing = order?.billing || {}
    const shipping = order?.shippingAddress || {}

    setValue('customer-legal-name', billing.companyName, '[checkout input]')
    setValue('customer-registered-address', billing.address, '[checkout input]')
    setValue(
      'signer-details',
      joinParts([billing.contactName, billing.jobTitle, billing.email]),
      '[checkout input]',
    )
    setValue(
      'ship-to-details',
      joinParts(
        [formatAddress(shipping), formatContactName(shipping), clean(shipping.phone)],
        '\n',
      ),
      '[checkout input]',
    )

    const quantity = Number(order?.quantity) || 1000
    const unitPrice = Number(order?.unitPrice) || 5.49
    const productAmount = productSubtotal(order) || quantity * unitPrice
    const shippingFee = shippingFeeFor(order)
    const tax = Number(order?.tax) || 0
    const total = order ? orderTotal(order) : productAmount + shippingFee + tax
    const taxLabel = order?.pricing?.taxCollected
      ? money.format(tax)
      : `Calculated at checkout; ${money.format(0)} if FC has no collection obligation`

    setValue('summary-quantity', `${number.format(quantity)} units`, '1,000 units')
    setValue('summary-unit-price', money.format(unitPrice), 'US$5.49')
    setValue('summary-product-amount', money.format(productAmount), 'US$5,490.00')
    setValue(
      'summary-shipping-amount',
      money.format(shippingFee),
      'US$800.00',
    )
    setValue('summary-tax', taxLabel, 'Calculated at checkout; US$0.00 if FC has no collection obligation')
    setValue(
      'summary-total',
      `${money.format(total)} plus displayed U.S. Sales Tax, if any`,
      'US$6,290.00 plus displayed U.S. Sales Tax, if any',
    )
  }

  fillDocument()
  window.addEventListener('focus', fillDocument)
  window.addEventListener('pageshow', fillDocument)
  window.addEventListener('storage', fillDocument)
})()
