import { orderTotal } from '../config'
import type { OrderState } from '../types'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const number = new Intl.NumberFormat('en-US')

export function PreviewCheckoutDock({ order, now }: { order: OrderState; now: number }) {
  return (
    <div className="checkout-dock preview-checkout-dock" role="region" aria-label="Order checkout">
      <div className="dock-total"><span>{number.format(order.quantity)} magnets</span><strong>{money.format(orderTotal(order, now))}</strong><small>Estimated total</small></div>
      <div className="dock-actions"><a className="primary-action" href="#plan">Pay now <span>→</span></a></div>
    </div>
  )
}
