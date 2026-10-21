import type { HTMLAttributes, ReactNode } from 'react'
import '../tokens.css'
import './styles.css'

export type CardProps = HTMLAttributes<HTMLElement> & {
  tone?: 'plain' | 'soft' | 'dark' | 'mist' | 'lilac' | 'gold' | 'teal' | 'clay' | 'coral'
  children: ReactNode
}

export function Card({ tone = 'plain', className = '', children, ...props }: CardProps) {
  return <article className={`ui-card ui-card--${tone}${className ? ` ${className}` : ''}`} {...props}>{children}</article>
}
