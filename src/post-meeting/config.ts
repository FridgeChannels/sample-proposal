import type { OrderState, OrderStatus } from './types'

export const LIVE_DEMO_ORIGIN = 'https://dealquest.fridgechannels.com'
export const LIVE_DEMO_URL = `${LIVE_DEMO_ORIGIN}/p/I9B44VTIHP`

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
  ready_for_checkout: 'Ready to Pay',
  approved: 'Approved',
  sent_to_finance: 'Sent to Finance',
  payment_pending: 'Payment Pending',
  paid: 'Paid',
  expired: 'Expired',
  cancelled: 'Cancelled',
  changes_requested: 'Changes Requested',
}

export const PILOT_DISCOUNT_RATE = 0.2
export const FIXED_MAGNET_QUANTITY = 1000

export const defaultOrder: OrderState = {
  status: 'ready_for_checkout',
  orderNumber: 'FC-2026-001',
  invoiceNumber: 'INV-FC-2026-001',
  version: 1,
  quantity: FIXED_MAGNET_QUANTITY,
  currency: 'USD',
  unitPrice: 5.49,
  tax: 0,
  offerStartedAt: '',
  offerExpiresAt: '',
  pricing: {
    loaded: false,
    magnetSn: null,
    minQuantity: 1000,
    discountRatio: 0.8,
    discountPercentOff: 20,
    discountActive: true,
    discountId: null,
    taxLabel: 'Not collected',
    taxCollected: false,
  },
  package: {
    id: 'post-purchase-moat',
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
  lineItems: [
    { id: 'magnets', label: '1,000 NFC magnets', detail: '$5.49 per magnet / year', amount: 5490 },
    { id: 'shipping', label: 'Estimated shipping', amount: 350 },
    { id: 'discount', label: 'Pilot discount · 20% off', amount: -1717, kind: 'discount' },
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
  },
  billing: {
    companyName: 'Nike, Inc.',
    contactName: '',
    address: '',
    poNumber: '',
  },
  paymentMethod: 'ach',
}

export type PilotOfferPhase = 'active' | 'urgent' | 'secured' | 'expired'

export const pilotOfferRemainingMs = (order: OrderState, now = Date.now()) => {
  const expiry = Date.parse(order.offerExpiresAt)
  return Number.isFinite(expiry) ? Math.max(0, expiry - now) : 0
}

export const pilotOfferPhase = (order: OrderState, now = Date.now()): PilotOfferPhase => {
  const expiry = Date.parse(order.offerExpiresAt)
  const paidAt = order.paidAt ? Date.parse(order.paidAt) : Number.NaN
  if (Number.isFinite(paidAt) && paidAt <= expiry) return 'secured'
  const remaining = pilotOfferRemainingMs(order, now)
  if (remaining <= 0) return 'expired'
  return remaining <= 24 * 60 * 60 * 1000 ? 'urgent' : 'active'
}

export const isPilotDiscountApplied = (order: OrderState, now = Date.now()) =>
  pilotOfferPhase(order, now) !== 'expired'

export const orderSubtotal = (order: OrderState, now = Date.now()) =>
  resolvedLineItems(order, now).reduce((sum, item) => sum + item.amount, 0)

export const orderTotal = (order: OrderState, now = Date.now()) => orderSubtotal(order, now) + order.tax

export const resolvedLineItems = (order: OrderState, now = Date.now()) => {
  const items = order.lineItems
    .filter((item) => item.id !== 'setup' && item.id !== 'production')
    .map((item) =>
    item.id === 'magnets'
      ? { ...item, label: `${new Intl.NumberFormat('en-US').format(order.quantity)} NFC magnets`, amount: order.quantity * order.unitPrice }
      : item,
    )
  const discountableAmount = items.filter((item) => item.id !== 'discount').reduce((sum, item) => sum + item.amount, 0)
  const discountAmount = -Math.round(discountableAmount * PILOT_DISCOUNT_RATE * 100) / 100

  return items
    .filter((item) => item.id !== 'discount' || isPilotDiscountApplied(order, now))
    .map((item) => item.id === 'discount'
      ? { ...item, label: 'Pilot discount · 20% off', amount: discountAmount }
      : item,
    )
}
