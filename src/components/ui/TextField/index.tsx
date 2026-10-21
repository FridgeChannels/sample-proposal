import { useId, type InputHTMLAttributes } from 'react'
import '../tokens.css'
import './styles.css'

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string
  hint?: string
  error?: string
}

export function TextField({ label, hint, error, id, required, className = '', ...props }: TextFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const hintId = `${fieldId}-hint`
  const errorId = `${fieldId}-error`
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined

  return (
    <label className={`ui-field${error ? ' ui-field--error' : ''}${className ? ` ${className}` : ''}`} htmlFor={fieldId}>
      <span className="ui-field__label">{label}{required && <span aria-hidden="true"> *</span>}</span>
      <input id={fieldId} required={required} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props} />
      {error ? <span className="ui-field__message" id={errorId}>{error}</span> : hint ? <span className="ui-field__hint" id={hintId}>{hint}</span> : null}
    </label>
  )
}
