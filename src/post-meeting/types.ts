export type ViewKey = 'demo' | 'plan' | 'content' | 'order' | 'address' | 'finance'

export type OrderStatus =
  | 'draft'
  | 'ready_for_approval'
  | 'ready_for_checkout'
  | 'approved'
  | 'sent_to_finance'
  | 'payment_pending'
  | 'paid'
  | 'expired'
  | 'cancelled'
  | 'changes_requested'

export type PaymentMethod = 'ach' | 'bank_transfer' | 'card'

export type SelectedPackage = {
  id: string
  code?: string
  name: string
  description: string
  campaignType: string
  serviceModel: string
  features: string[]
  integrations: string[]
  includedServices: Array<{ title: string; items: string[] }>
}

export type OrderLineItem = {
  id: string
  label: string
  detail?: string
  amount: number
  kind?: 'standard' | 'discount'
}

export type ApprovalRecord = {
  name: string
  email: string
  jobTitle?: string
  approvedAt: string
  orderVersion: number
  confirmedAmount: number
}

export type FinanceHandoffStatus = 'sending' | 'sent' | 'preview' | 'payment_pending' | 'paid' | 'failed' | 'expired' | 'revoked'

export type FinanceHandoff = {
  token: string
  status: FinanceHandoffStatus
  paymentUrl: string
  sentAt: string
  expiresAt: string
}

export type BillingDetails = {
  companyName: string
  contactName: string
  address: string
  poNumber: string
}

export type ShippingAddress = {
  recipientName: string
  companyName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  email?: string
}

/** Server-backed pilot pricing snapshot for the live deal room. */
export type PilotPricing = {
  loaded: boolean
  magnetSn: string | null
  minQuantity: number
  /** Pay multiplier from DB (1 = no discount, 0.8 = 20% off). */
  discountRatio: number
  /** Display percent off, e.g. 20 for "20% OFF". */
  discountPercentOff: number
  discountActive: boolean
  discountId: string | null
  taxLabel: string
  taxCollected: boolean
  error?: string
}

export type OrderState = {
  status: OrderStatus
  orderNumber: string
  invoiceNumber: string
  version: number
  quantity: number
  currency: 'USD'
  unitPrice: number
  tax: number
  offerStartedAt: string
  offerExpiresAt: string
  package: SelectedPackage
  lineItems: OrderLineItem[]
  scopeIncluded: string[]
  scopeExcluded: string[]
  timeline: Array<{ title: string; duration: string; detail?: string; output: string }>
  estimatedLaunch: string
  paymentTerms: string
  approval?: ApprovalRecord
  financeHandoff?: FinanceHandoff
  shippingAddress: ShippingAddress
  billing: BillingDetails
  paymentMethod: PaymentMethod
  paidAt?: string
  sentAt?: string
  pricing: PilotPricing
  /** Persisted Supabase order.id after Place Order */
  dbOrderId?: number | null
  /** Persisted shipping_address.id */
  shippingAddressId?: number | null
}
