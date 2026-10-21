import type { ButtonHTMLAttributes, ReactNode } from 'react'
import '../tokens.css'
import './styles.css'

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> & {
  label: string
  children: ReactNode
  tone?: 'plain' | 'dark' | 'light'
  unstyled?: boolean
}

export function IconButton({ label, children, tone = 'plain', unstyled = false, className = '', type = 'button', ...props }: IconButtonProps) {
  const baseClass = unstyled ? '' : `ui-icon-button ui-icon-button--${tone}`
  return <button className={[baseClass, className].filter(Boolean).join(' ')} type={type} aria-label={label} {...props}>{children}</button>
}
