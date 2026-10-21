import '../tokens.css'
import './styles.css'

export type BrandMarkProps = { name: string; initials?: string; tone?: 'dark' | 'lilac' | 'gold' | 'light'; compact?: boolean }

export function BrandMark({ name, initials, tone = 'dark', compact = false }: BrandMarkProps) {
  const letters = initials ?? name.slice(0, 2).toUpperCase()
  return (
    <div className={`ui-brand-mark ui-brand-mark--${tone}${compact ? ' ui-brand-mark--compact' : ''}`} role="img" aria-label={name}>
      <span className="ui-brand-mark__symbol" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 4 28 25H4L16 4Z" /><path d="m16 13 5 9h-10l5-9Z" /></svg></span>
      {!compact && <span>{name}</span>}
      <span className="ui-brand-mark__initials" aria-hidden="true">{letters}</span>
    </div>
  )
}
