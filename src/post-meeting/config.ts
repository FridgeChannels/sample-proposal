import type { OrderState, OrderStatus } from './types'

export const LIVE_DEMO_URL = 'https://dealquest.fridgechannels.com/p/I9B44VTIHP'

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

export const defaultOrder: OrderState = {
  status: 'ready_for_approval',
  orderNumber: 'FC-2026-001',
  invoiceNumber: 'INV-FC-2026-001',
  version: 1,
  quantity: 1500,
  currency: 'USD',
  unitPrice: 5.49,
  tax: 0,
  package: {
    name: 'Retention Moat',
    description: 'FC configures and operates a complete retention experience for your team, from physical touchpoint through campaign reporting.',
    campaignType: 'Managed retention pilot',
    serviceModel: 'Fully managed by FridgeChannel',
    features: [
      'Custom NFC magnet design and production',
      'Campaign and challenge configuration',
      'Coupon and reward logic',
      'Weekly campaign management',
      'Performance reporting',
    ],
    integrations: ['Shopify', 'Klaviyo'],
  },
  lineItems: [
    { id: 'magnets', label: '1,500 NFC magnets', detail: '$5.49 per magnet / year', amount: 8235 },
    { id: 'shipping', label: 'Estimated shipping', amount: 350 },
    { id: 'discount', label: 'Pilot discount', amount: -585, kind: 'discount' },
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
    { title: 'Brand assets submitted', detail: 'Timeline begins after all required assets are received.', requiresCustomer: true },
    { title: 'Magnet design confirmed', detail: 'Customer approval required before production.', requiresCustomer: true },
    { title: 'Campaign configured', detail: 'FC builds the approved challenge and reward logic.' },
    { title: 'Shopify and Klaviyo connected', detail: 'Customer credentials and access required.', requiresCustomer: true },
    { title: 'Production begins', detail: 'Final quantity is locked for manufacturing.' },
    { title: 'Campaign goes live', detail: 'Estimated 6-8 weeks after payment and asset receipt.' },
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
    email: '',
    address: '',
    poNumber: '',
  },
  paymentMethod: 'ach',
}

export const orderSubtotal = (order: OrderState) =>
  resolvedLineItems(order).reduce((sum, item) => sum + item.amount, 0)

export const orderTotal = (order: OrderState) => orderSubtotal(order) + order.tax

export const resolvedLineItems = (order: OrderState) => order.lineItems
  .filter((item) => item.id !== 'setup' && item.id !== 'production')
  .map((item) =>
    item.id === 'magnets'
      ? { ...item, label: `${new Intl.NumberFormat('en-US').format(order.quantity)} NFC magnets`, amount: order.quantity * order.unitPrice }
      : item,
  )
