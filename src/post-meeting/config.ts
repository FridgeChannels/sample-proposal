import type { OrderState, OrderStatus } from './types'

/** Host for the embedded customer demo (same /p/{sn} shape as sample.fridgechannels.com). */
export const LIVE_DEMO_ORIGIN = 'https://dealquest.fridgechannels.com'

/** @deprecated Prefer liveDemoUrlForSn — kept for callers that need a default demo URL. */
export const LIVE_DEMO_URL = `${LIVE_DEMO_ORIGIN}/p/I9B44VTIHP`

/**
 * Read magnet SN from /p/{sn} (or legacy /gift-proposal/{sn}), then ?sn= / ?id=.
 * Used so the live iframe tracks the customer link without hardcoding SN.
 */
export const snFromLocation = (location: Pick<Location, 'pathname' | 'search'> = window.location): string | null => {
  const pathMatch = /^\/(?:gift-proposal|p)\/([^/?#]+)\/?$/.exec(location.pathname)
  if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1])
  const params = new URLSearchParams(location.search)
  return params.get('sn') || params.get('id') || null
}

export const liveDemoUrlForSn = (sn: string) =>
  `${LIVE_DEMO_ORIGIN}/p/${encodeURIComponent(sn)}`

export const statusLabels: Record<OrderStatus, string> = {
  draft: 'Draft',
  ready_for_approval: 'Ready for Approval',
  approved: 'Approved',
  sent_to_finance: 'Sent to Finance',
  viewed_by_finance: 'Viewed by Finance',
  payment_pending: 'Payment Pending',
  paid: 'Paid',
  expired: 'Expired',
  cancelled: 'Cancelled',
  changes_requested: 'Changes Requested',
}

/** Fallback only before /api/pilot-quote loads. Prefer order.pricing.discountPercentOff. */
export const PILOT_DISCOUNT_RATE = 0.2

export const defaultPricing = {
  loaded: false,
  magnetSn: null as string | null,
  minQuantity: 1000,
  discountRatio: 0.8,
  discountPercentOff: 20,
  discountActive: true,
  discountId: null as string | null,
  taxLabel: 'Not collected',
  taxCollected: false,
}

export const defaultOrder: OrderState = {
  status: 'ready_for_approval',
  orderNumber: 'FC-2026-001',
  invoiceNumber: 'INV-FC-2026-001',
  version: 1,
  quantity: 1500,
  currency: 'USD',
  unitPrice: 5.49,
  tax: 0,
  offerStartedAt: '',
  offerExpiresAt: '',
  pricing: { ...defaultPricing },
  package: {
    id: 'post-purchase-moat',
    code: 'PKG-PPM',
    name: 'Post-Purchase Moat',
    description: 'A complete in-home retention and post-purchase relationship layer, from the physical touchpoint through lifecycle activation and measurement.',
    campaignType: 'Post-Purchase Moat',
    serviceModel: 'Fully managed by FridgeChannel',
    features: [
      'Custom NFC magnet design and production',
      'Campaign and challenge configuration',
      'Coupon and reward logic',
      'Weekly campaign management',
      'Performance reporting',
    ],
    integrations: ['Shopify', 'Klaviyo'],
    includedServices: [
      {
        title: 'In-Home Touchpoint',
        items: [
          'Branded NFC fridge magnet',
          'Tap-to-open customer experience',
          'One branded landing page',
          'One universal customer CTA',
          'One universal Fresh Perk or offer',
          'Basic Tap and engagement tracking',
          'Basic campaign report',
        ],
      },
      {
        title: 'Lifecycle Purchase Activation',
        items: [
          'Dynamic, segment-based experience',
          'Customer segment recognition',
          'Lifecycle-based purchase CTA',
          'Segment-specific starting offer',
          'Segment-specific reward rules',
          'Replenishment-window logic',
          'Subscriber / non-subscriber logic',
          'Win-back logic',
          'Lifecycle targeting: new / active / replenishment / win-back / VIP',
        ],
      },
      {
        title: 'Integrations & Measurement',
        items: [
          'Shopify integration',
          'Klaviyo integration',
          'Segment-level measurement',
          'Repeat-purchase measurement',
          '60- and 90-day LTV reporting',
        ],
      },
      {
        title: 'Post-Purchase Relationship Layer',
        items: [
          'Surveys, quizzes, and preference capture',
          'Brand and product education modules',
          'Newsletter or community enrollment',
          'Referral and review actions',
          'UGC collection',
          'Challenges and customer missions',
          'Seasonal campaign modules',
          'New-product launch modules',
          'Recipe and content experiences',
        ],
      },
    ],
  },
  // Shipping deferred — omitted from breakdown until packages.shipping_* is wired.
  lineItems: [
    { id: 'magnets', label: '1,500 NFC magnets', detail: '$5.49 per magnet / year', amount: 8235 },
    { id: 'discount', label: 'Pilot discount · 20% OFF', amount: -1717, kind: 'discount' },
  ],
  scopeIncluded: [
    'Magnet visual design',
    'Magnet manufacturing',
    'NFC configuration',
    'Campaign setup',
    'Game or challenge configuration',
    'Coupon logic',
    'Shopify integration',
    'Klaviyo integration',
    'Dashboard access and reporting',
    'Weekly operations support',
  ],
  scopeExcluded: [
    'Customer-paid rewards',
  ],
  timeline: [
    { title: 'Ordered', duration: 'Order confirmed', output: 'Pilot officially starts.' },
    { title: 'Brand inputs & campaign rules', duration: '~1 day', detail: 'Brand provides logo, colors, product references, target audience, reward rules, and Shopify / Klaviyo requirements. FC translates them into setup requirements.', output: 'Campaign setup brief confirmed.' },
    { title: 'NFC magnet design', duration: '~2 days', detail: 'FC designs the front and back of the branded NFC fridge magnet and prepares production files. Brand approves — two standard revision rounds included.', output: 'Final magnet artwork approved.' },
    { title: 'Mobile reward experience & dashboard setup', duration: '~1 day', detail: 'FC configures the branded reward page, challenge flow, points and unlock logic, tracking events, and the campaign dashboard. Brand confirms key rules.', output: 'Tap experience and dashboard ready.' },
    { title: 'Shopify & Klaviyo connection', duration: '~1 day', detail: 'Brand connects Shopify and Klaviyo through its own secure authorization. FC assists with coupon rules, segment logic, reward setup, and measurement.', output: 'Brand systems connected for launch.' },
    { title: 'Production, QA & delivery', duration: '7–10 days', detail: 'FC produces the magnets, sets the NFC destination, runs tap tests, verifies reward logic, and ships to the agreed location. Brand confirms the delivery address. After final artwork approval — depending on quantity and destination.', output: 'Finished NFC magnets delivered.' },
    { title: 'Fulfillment launch', duration: 'Launch', detail: 'Brand decides which customers receive magnets and includes them in selected orders via its warehouse, fulfillment team, or 3PL. FC keeps the experience live.', output: 'Magnets enter customer homes through real shipments.' },
    { title: 'Results review & next step', duration: 'Pilot review', detail: 'Brand reviews active magnets, taps, challenge participation, rewards unlocked, coupons redeemed, repeat orders, and attributed revenue. FC provides the pilot readout, insights, and scale recommendation.', output: 'Decide whether to scale, adjust, or stop.' },
  ],
  estimatedLaunch: '6-8 weeks after payment and asset receipt',
  paymentTerms: 'Due on receipt',
  shippingAddress: {
    recipientName: '',
    companyName: 'Nike, Inc.',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
    email: '',
  },
  billing: {
    companyName: 'Nike, Inc.',
    contactName: '',
    email: '',
    address: '',
    poNumber: '',
  },
  paymentMethod: 'card',
  dbOrderId: null,
  shippingAddressId: null,
}

export type PilotOfferPhase = 'active' | 'urgent' | 'secured' | 'expired' | 'none'

export const discountRateForOrder = (order: OrderState) => {
  if (order.pricing?.discountPercentOff != null) return order.pricing.discountPercentOff / 100
  return PILOT_DISCOUNT_RATE
}

export const pilotOfferRemainingMs = (order: OrderState, now = Date.now()) => {
  const expiry = Date.parse(order.offerExpiresAt)
  return Number.isFinite(expiry) ? Math.max(0, expiry - now) : 0
}

export const pilotOfferPhase = (order: OrderState, now = Date.now()): PilotOfferPhase => {
  if (order.pricing?.loaded && !order.pricing.discountActive) return 'none'
  const expiry = Date.parse(order.offerExpiresAt)
  const approvedAt = order.approval ? Date.parse(order.approval.approvedAt) : Number.NaN
  if (Number.isFinite(approvedAt) && (!Number.isFinite(expiry) || approvedAt <= expiry)) return 'secured'
  if (!Number.isFinite(expiry)) return order.pricing?.discountActive ? 'active' : 'none'
  const remaining = pilotOfferRemainingMs(order, now)
  if (remaining <= 0) return 'expired'
  return remaining <= 24 * 60 * 60 * 1000 ? 'urgent' : 'active'
}

export const isPilotDiscountApplied = (order: OrderState, now = Date.now()) => {
  const phase = pilotOfferPhase(order, now)
  if (phase === 'none' || phase === 'expired') return false
  return (order.pricing?.discountPercentOff ?? 0) > 0 || !order.pricing?.loaded
}

export const orderSubtotal = (order: OrderState, now = Date.now()) =>
  resolvedLineItems(order, now).reduce((sum, item) => sum + item.amount, 0)

export const orderTotal = (order: OrderState, now = Date.now()) => orderSubtotal(order, now) + order.tax

export const resolvedLineItems = (order: OrderState, now = Date.now()) => {
  const unitDetail = `$${order.unitPrice.toFixed(2)} per magnet / year`
  const items = order.lineItems
    .filter((item) => item.id !== 'setup' && item.id !== 'production' && item.id !== 'shipping')
    .map((item) =>
      item.id === 'magnets'
        ? {
            ...item,
            label: `${new Intl.NumberFormat('en-US').format(order.quantity)} NFC magnets`,
            detail: unitDetail,
            amount: order.quantity * order.unitPrice,
          }
        : item,
    )

  const discountableAmount = items.filter((item) => item.id !== 'discount').reduce((sum, item) => sum + item.amount, 0)
  const rate = discountRateForOrder(order)
  const discountAmount = -Math.round(discountableAmount * rate * 100) / 100
  const percentLabel = Math.round(rate * 100)

  return items
    .filter((item) => item.id !== 'discount' || isPilotDiscountApplied(order, now))
    .map((item) =>
      item.id === 'discount'
        ? { ...item, label: `Pilot discount · ${percentLabel}% OFF`, amount: discountAmount }
        : item,
    )
}

export const clampQuantity = (quantity: number, minQuantity: number) =>
  Math.max(minQuantity, Number.isFinite(quantity) ? quantity : minQuantity)

/** Map /api/pilot-quote payload onto order state (prices come from server only). */
export const applyPilotQuoteToOrder = (order: OrderState, quote: {
  sn: string
  brandName?: string | null
  package: {
    id: string
    code: string
    name: string
    description: string
    year1Price: number
    currency: string
    billingUnit: string
    minQuantity: number
  }
  includedServices?: Array<{ title: string; items: string[] }>
  discount: {
    id: string
    ratio: number
    percentOff: number
    active: boolean
    expiresAt: string | null
  }
  tax: { collected: boolean; label: string; amount: number }
}): OrderState => {
  const minQuantity = quote.package.minQuantity || order.pricing.minQuantity || 1000
  const quantity = clampQuantity(order.quantity, minQuantity)
  const unitPrice = quote.package.year1Price
  const offerExpiresAt = quote.discount.expiresAt || order.offerExpiresAt
  const offerStartedAt = order.offerStartedAt || new Date().toISOString()

  return {
    ...order,
    quantity,
    unitPrice,
    tax: quote.tax.amount || 0,
    offerStartedAt,
    offerExpiresAt: offerExpiresAt || '',
    pricing: {
      loaded: true,
      magnetSn: quote.sn,
      minQuantity,
      discountRatio: quote.discount.ratio,
      discountPercentOff: quote.discount.percentOff,
      discountActive: quote.discount.active,
      discountId: quote.discount.id,
      taxLabel: quote.tax.label || 'Not collected',
      taxCollected: Boolean(quote.tax.collected),
    },
    package: {
      ...order.package,
      id: quote.package.code || quote.package.id,
      code: quote.package.code,
      name: quote.package.name,
      description: quote.package.description || order.package.description,
      campaignType: quote.package.name,
      includedServices: quote.includedServices?.length ? quote.includedServices : order.package.includedServices,
    },
    lineItems: [
      {
        id: 'magnets',
        label: `${new Intl.NumberFormat('en-US').format(quantity)} NFC magnets`,
        detail: `$${unitPrice.toFixed(2)} per magnet / year`,
        amount: quantity * unitPrice,
      },
      {
        id: 'discount',
        label: `Pilot discount · ${Math.round(quote.discount.percentOff)}% OFF`,
        amount: 0,
        kind: 'discount',
      },
    ],
    billing: {
      ...order.billing,
      companyName: order.billing.companyName || quote.brandName || order.billing.companyName,
    },
    shippingAddress: {
      ...order.shippingAddress,
      companyName: order.shippingAddress.companyName || quote.brandName || order.shippingAddress.companyName,
    },
  }
}

export async function createStripeCheckout(payload: { orderId?: number | null; sn?: string | null; quantity: number; financeToken?: string }) {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: payload.orderId || undefined,
      sn: payload.sn || undefined,
      quantity: payload.quantity,
      financeToken: payload.financeToken || undefined,
      baseUrl: window.location.origin,
    }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Unable to start Stripe Checkout.')
  return data as { url: string; id: string }
}
