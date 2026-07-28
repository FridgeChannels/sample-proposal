import { useState, type FormEvent } from 'react'
import type { ViewerIdentity } from '../types'

const displayNameFromEmail = (email: string) => email
  .split('@')[0]
  .split(/[._-]/)
  .filter(Boolean)
  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ') || 'Business customer'

export function LoginView({ onSuccess, onBack }: { onSuccess: (identity: ViewerIdentity) => void; onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const complete = (provider: ViewerIdentity['provider'], address: string, name?: string) => onSuccess({
    name: name || displayNameFromEmail(address),
    email: address,
    provider,
    signedInAt: new Date().toISOString(),
  })

  const continueWithEmail = (event: FormEvent) => {
    event.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid work email.')
    setError('')
    complete('email', email.trim())
  }

  return (
    <main className="login-view">
      <header className="login-header">
        <button type="button" onClick={onBack} aria-label="Go back">←</button>
        <div className="brand-mark"><span>FC</span><strong>FridgeChannel</strong></div>
      </header>

      <section className="login-shell is-default">
        <div className="login-heading">
          <h1>Sign in or create an account</h1>
          <p>Get smarter responses and share files, images, and other content.</p>
        </div>
        <div className="login-methods">
          <button className="google-login" type="button" onClick={() => complete('google', 'alex@company.com', 'Alex Chen')}><span aria-hidden="true">G</span>Sign in with Google</button>
          <div className="login-divider"><span>or</span></div>
          <form onSubmit={continueWithEmail} noValidate>
            <label><span>Email address</span><input autoFocus type="email" autoComplete="email" inputMode="email" placeholder="you@company.com" value={email} onChange={event => setEmail(event.target.value)} aria-invalid={!!error} /></label>
            {error && <small className="field-error">{error}</small>}
            <button className="primary-action" type="submit">Continue</button>
          </form>
          <p className="login-legal"><a href="#terms">Terms of use</a><i aria-hidden="true">|</i><a href="#privacy">Privacy policy</a></p>
        </div>
      </section>
    </main>
  )
}
