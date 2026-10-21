import type { HTMLAttributes } from 'react'
import '../tokens.css'
import './styles.css'

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: 'neutral' | 'gold' | 'lilac' | 'teal' | 'mint' | 'coral' }

export function Badge({ tone = 'neutral', className = '', children, ...props }: BadgeProps) {
  return <span className={`ui-badge ui-badge--${tone}${className ? ` ${className}` : ''}`} {...props}>{children}</span>
}
