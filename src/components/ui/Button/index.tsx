import type { ButtonHTMLAttributes, ReactNode } from 'react'
import '../tokens.css'
import './styles.css'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  startIcon?: ReactNode
  endIcon?: ReactNode
}

export function Button({ variant = 'primary', size = 'md', startIcon, endIcon, className = '', children, type = 'button', ...props }: ButtonProps) {
  return (
    <button className={`ui-button ui-button--${variant} ui-button--${size}${className ? ` ${className}` : ''}`} type={type} {...props}>
      {startIcon && <span className="ui-button__icon" aria-hidden="true">{startIcon}</span>}
      <span>{children}</span>
      {endIcon && <span className="ui-button__icon" aria-hidden="true">{endIcon}</span>}
    </button>
  )
}
