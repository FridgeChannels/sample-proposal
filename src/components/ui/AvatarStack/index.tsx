import '../tokens.css'
import './styles.css'

export type AvatarStackProps = { names: string[]; max?: number; label?: string }

export function AvatarStack({ names, max = 4, label = 'People' }: AvatarStackProps) {
  const visible = names.slice(0, max)
  const remaining = Math.max(0, names.length - visible.length)
  return (
    <div className="ui-avatar-stack" role="img" aria-label={`${label}: ${names.join(', ')}`}>
      {visible.map((name, index) => <span className={`ui-avatar ui-avatar--${index % 4}`} key={`${name}-${index}`} aria-hidden="true">{name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>)}
      {remaining > 0 && <span className="ui-avatar ui-avatar--more" aria-hidden="true">+{remaining}</span>}
    </div>
  )
}
