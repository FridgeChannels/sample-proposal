export type ViewKey = 'demo' | 'content' | 'order' | 'address' | 'finance'

export type OrderStatus =
  | 'draft'
  | 'ready_for_approval'
  | 'approved'
  | 'sent_to_finance'
  | 'viewed_by_finance'
  | 'payment_pending'
  | 'paid'
  | 'expired'
  | 'cancelled'
  | 'changes_requested'

export type PaymentMethod = 'ach' | 'bank_transfer' | 'card'

export type SelectedPackage = {
  id: 'presence' | 'in-home-retention-asset' | 'post-purchase-moat'
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

export type FinanceContact = {
  name: string
  email: string
  companyName: string
  billingEmail: string
  ccCurrentContact: boolean
  poNumber?: string
  billingAddress?: string
  message?: string
  accountsPayableEmail?: string
  taxExemptionInfo?: string
}

export type FinanceHandoffStatus = 'sending' | 'sent' | 'preview' | 'viewed' | 'payment_pending' | 'paid' | 'failed' | 'expired' | 'revoked'

export type FinanceHandoff = {
  token: string
  email: string
  name?: string
  status: FinanceHandoffStatus
  paymentUrl: string
  sentAt: string
  viewedAt?: string
  expiresAt: string
}

export type BillingDetails = {
  companyName: string
  contactName: string
  email: string
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
  financeContact?: FinanceContact
  financeHandoff?: FinanceHandoff
  shippingAddress: ShippingAddress
  billing: BillingDetails
  paymentMethod: PaymentMethod
  paidAt?: string
  sentAt?: string
}
