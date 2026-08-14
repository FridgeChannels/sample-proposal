import type { OrderLineItem, OrderState, OrderStatus, ShippingMethod } from './types'

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

export const FIXED_MAGNET_QUANTITY = 1000
export const SHIPPING_OPTIONS: Record<ShippingMethod, { label: string; eta: string; fee: number }> = {
  ocean: { label: 'Economy Shipping by Sea', eta: 'Estimated 35 days', fee: 200 },
  air: { label: 'Express Air Shipping', eta: 'Estimated 5–12 days', fee: 800 },
}
export const PILOT_OFFER_DURATION_MS = 8 * 24 * 60 * 60 * 1000

/**
 * Reads an API response as JSON, throwing a readable error when the server
 * returned a non-JSON body (stale server, proxy miss, gateway error page).
 */
export async function readApiJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  const raw = await response.text()
  let data: unknown = null
  try {
    data = raw ? JSON.parse(raw) : null
  } catch {
    const detail = raw.trim().slice(0, 120)
    throw new Error(
      response.ok
        ? `${fallbackMessage} (unexpected response: ${detail || 'empty body'})`
        : `${fallbackMessage} (HTTP ${response.status}: ${detail || 'no details'})`,
    )
  }
  if (!response.ok) {
    const message = (data as { error?: string } | null)?.error
    throw new Error(message || `${fallbackMessage} (HTTP ${response.status})`)
  }
  return data as T
}

export type PilotQuoteApiResponse = {
  quote: {
    sn: string
    brandName: string | null
    customerId: number | null
    customerCreatedAt: string | null
    customerEmail: string | null
    package: {
      id: string
      code: string
      name: string
      description: string
      bestFit: string
      year1Price: number
      minQuantity: number
      currency: string
    }
    includedServices: Array<{ title: string; items: string[] }>
    discount: {
      id: string | null
      ratio: number
      percentOff: number
      active: boolean
      expiresAt: string | null
    }
    pilot?: {
      kpi: string | null
      segment: string | null
      durationDays: number | null
      confirmedAt: string | null
    }
    tax: { collected: boolean; label: string; amount: number }
  }
  totals: {
    quantity: number
    unitPrice: number
    magnetsAmount: number
    discountAmount: number
    taxAmount: number
    total: number
    currency: string
  }
}

export const defaultOrder: OrderState = {
  status: 'ready_for_checkout',
  brandName: '',
  createdAt: '',
  orderNumber: 'FC-2026-001',
  invoiceNumber: 'INV-FC-2026-001',
  version: 1,
  quantity: FIXED_MAGNET_QUANTITY,
  currency: 'USD',
  unitPrice: 0,
  tax: 0,
  offerStartedAt: '',
  offerExpiresAt: '',
  pricing: {
    loaded: false,
    magnetSn: null,
    minQuantity: FIXED_MAGNET_QUANTITY,
    discountRatio: 1,
    discountPercentOff: 0,
    discountActive: false,
    discountId: null,
    taxLabel: 'Not collected',
    taxCollected: false,
  },
  package: {
    id: 'post-purchase-moat',
    name: 'Post-Purchase Moat',
    description: '',
    campaignType: 'Post-Purchase Moat',
    serviceModel: 'Fully managed by FridgeChannel',
    features: [],
    integrations: [],
    includedServices: [],
  },
  lineItems: [],
  scopeIncluded: [],
  scopeExcluded: [],
  timeline: [],
  estimatedLaunch: '',
  paymentTerms: 'Due on receipt',
  shippingAddress: {
    firstName: '',
    lastName: '',
    recipientName: '',
    companyName: '',
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
    companyName: '',
    contactName: '',
    address: '',
    poNumber: '',
  },
  shippingMethod: 'air',
  paymentMethod: 'card',
}

export function applyQuoteToOrder(order: OrderState, payload: PilotQuoteApiResponse): OrderState {
  const { quote, totals } = payload
  const startedAt = new Date().toISOString()
  const expiresAt = quote.discount.expiresAt || new Date(Date.now() + PILOT_OFFER_DURATION_MS).toISOString()
  const number = new Intl.NumberFormat('en-US')

  const lineItems: OrderLineItem[] = [
    {
      id: 'magnets',
      label: `${number.format(totals.quantity)} NFC magnets`,
      detail: `$${totals.unitPrice.toFixed(2)} per magnet / year`,
      amount: totals.magnetsAmount,
    },
  ]
  if (quote.discount.active && totals.discountAmount < 0) {
    lineItems.push({
      id: 'discount',
      label: `Pilot discount · ${quote.discount.percentOff}% off`,
      amount: totals.discountAmount,
      kind: 'discount',
    })
  }

  return {
    ...order,
    brandName: quote.brandName || '',
    createdAt: quote.customerCreatedAt || '',
    quantity: totals.quantity,
    unitPrice: totals.unitPrice,
    tax: totals.taxAmount,
    currency: 'USD',
    offerStartedAt: startedAt,
    offerExpiresAt: expiresAt,
    package: {
      id: quote.package.id,
      code: quote.package.code,
      name: quote.package.name,
      description: quote.package.description,
      campaignType: quote.package.name,
      serviceModel: 'Fully managed by FridgeChannel',
      features: [],
      integrations: [],
      includedServices: quote.includedServices,
    },
    lineItems,
    shippingAddress: {
      ...order.shippingAddress,
      companyName: quote.brandName || order.shippingAddress.companyName,
    },
    billing: {
      ...order.billing,
      companyName: quote.brandName || order.billing.companyName,
    },
    pricing: {
      loaded: true,
      magnetSn: quote.sn,
      minQuantity: quote.package.minQuantity,
      discountRatio: quote.discount.ratio,
      discountPercentOff: quote.discount.percentOff,
      discountActive: quote.discount.active,
      discountId: quote.discount.id,
      taxLabel: quote.tax.label,
      taxCollected: quote.tax.collected,
    },
    pilot: quote.pilot ?? order.pilot,
  }
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
  order.pricing.discountActive && pilotOfferPhase(order, now) !== 'expired'

export const orderSubtotal = (order: OrderState, now = Date.now()) =>
  resolvedLineItems(order, now).reduce((sum, item) => sum + item.amount, 0)

export const shippingFee = (_order?: OrderState) => SHIPPING_OPTIONS.air.fee

export const orderTotal = (order: OrderState, now = Date.now()) => orderSubtotal(order, now) + shippingFee(order) + order.tax

export const resolvedLineItems = (order: OrderState, now = Date.now()): OrderLineItem[] => {
  if (order.pricing.loaded && order.lineItems.length) {
    return order.lineItems
      .filter((item) => item.id !== 'discount' || isPilotDiscountApplied(order, now))
      .map((item) =>
        item.id === 'magnets'
          ? {
              ...item,
              label: `${new Intl.NumberFormat('en-US').format(order.quantity)} NFC magnets`,
              detail: `$${order.unitPrice.toFixed(2)} per magnet / year`,
              amount: order.quantity * order.unitPrice,
            }
          : item.id === 'discount' && order.pricing.discountActive
            ? {
                ...item,
                label: `Pilot discount · ${order.pricing.discountPercentOff}% off`,
                amount: -Math.round(order.quantity * order.unitPrice * (1 - order.pricing.discountRatio) * 100) / 100,
              }
            : item,
      )
  }

  const magnetsAmount = order.quantity * order.unitPrice
  const items: OrderLineItem[] = [
    {
      id: 'magnets',
      label: `${new Intl.NumberFormat('en-US').format(order.quantity)} NFC magnets`,
      detail: `$${order.unitPrice.toFixed(2)} per magnet / year`,
      amount: magnetsAmount,
    },
  ]
  if (order.pricing.discountActive && isPilotDiscountApplied(order, now)) {
    items.push({
      id: 'discount',
      label: `Pilot discount · ${order.pricing.discountPercentOff}% off`,
      amount: -Math.round(magnetsAmount * (1 - order.pricing.discountRatio) * 100) / 100,
      kind: 'discount' as const,
    })
  }
  return items
}
