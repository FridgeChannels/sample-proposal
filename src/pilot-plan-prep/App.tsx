import { useCallback, useEffect, useMemo, useState } from 'react'
import './prep.css'

type CalendlyInvitee = { name: string; email: string; status: string }
type CalendlyEvent = {
  uri: string
  name: string
  start_time: string
  end_time: string
  invitees: CalendlyInvitee[]
}

type Credentials = {
  email: string | null
  password: string | null
}

type ResolveData = {
  email: string | null
  match_level: string
  keyperson: { name: string; email: string } | null
  client: { title: string; nfc_sn: string | null } | null
  nfc_sn: string | null
  sample: Record<string, unknown> | null
  customer: { email?: string; nickname?: string } | null
  credentials?: Credentials | null
  warnings: string[]
}

type BindAccountData = {
  customer?: { email?: string }
  credentials?: Credentials | null
  created?: boolean
  password_issued?: boolean
}

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error((data as { error?: string }).error || fallback)
  return data as T
}

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

function emailNickname(email: string) {
  const local = email.trim().split('@')[0] || ''
  return local || null
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }
  const input = document.createElement('textarea')
  input.value = value
  input.setAttribute('readonly', 'true')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}

export function PilotPlanPrep() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [events, setEvents] = useState<CalendlyEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [selectedEventUri, setSelectedEventUri] = useState('')
  const [selectedEmail, setSelectedEmail] = useState('')
  const [manualSn, setManualSn] = useState('')
  const [resolve, setResolve] = useState<ResolveData | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [resolving, setResolving] = useState(false)
  const [bindingAccount, setBindingAccount] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [copiedField, setCopiedField] = useState<'email' | 'password' | 'both' | ''>('')

  const selectedEvent = useMemo(
    () => events.find((event) => event.uri === selectedEventUri) ?? null,
    [events, selectedEventUri],
  )

  const inviteeEmail = selectedEmail.trim()
  const resolvedSn = (manualSn.trim() || resolve?.nfc_sn || '').trim()
  const snVerified = Boolean(resolvedSn && resolve?.sample)
  const accountBound = Boolean(resolve?.customer?.email)
  const hasCredentials = Boolean(credentials?.email && credentials?.password)
  const canBind = Boolean(inviteeEmail && snVerified && (!accountBound || !hasCredentials))

  const meetUrl = resolvedSn
    ? `/pilot-plan/meet?sn=${encodeURIComponent(resolvedSn)}`
    : ''

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true)
    setError('')
    try {
      const payload = await readJson<{ events: CalendlyEvent[] }>(
        await fetch(`/api/calendly/events?date=${encodeURIComponent(date)}`),
        'Unable to load Calendly events.',
      )
      setEvents(payload.events)
      setSelectedEventUri('')
      setSelectedEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Calendly events.')
      setEvents([])
    } finally {
      setLoadingEvents(false)
    }
  }, [date])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  const runResolve = async (email: string, sn?: string) => {
    setResolving(true)
    setError('')
    setStatus('Matching client and sample…')
    try {
      const payload = await readJson<{ data: ResolveData }>(
        await fetch('/api/pilot-session/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, sn: sn || undefined }),
        }),
        'Resolve failed.',
      )
      setResolve(payload.data)
      if (payload.data.nfc_sn && !manualSn) setManualSn(payload.data.nfc_sn)
      if (payload.data.credentials?.email && payload.data.credentials?.password) {
        setCredentials(payload.data.credentials)
      }
      setStatus('Resolved.')
    } catch (err) {
      setResolve(null)
      setError(err instanceof Error ? err.message : 'Resolve failed.')
      setStatus('')
    } finally {
      setResolving(false)
    }
  }

  const onSelectEvent = (uri: string) => {
    setSelectedEventUri(uri)
    const event = events.find((item) => item.uri === uri)
    const email = event?.invitees[0]?.email || ''
    setSelectedEmail(email)
    setResolve(null)
    setCredentials(null)
    setCopiedField('')
    setStatus('')
    if (email) void runResolve(email)
  }

  const warnings = resolve?.warnings ?? []
  const sampleMissing = Boolean(resolvedSn && resolve && !resolve.sample)
  const readyBlocked = !resolvedSn || sampleMissing || !accountBound

  const bindAccount = async () => {
    const email = inviteeEmail
    const sn = resolvedSn
    if (!email) {
      setError('Invitee email is required.')
      return
    }
    if (!snVerified) {
      setError('Verify SN and confirm the sample exists first.')
      return
    }

    setBindingAccount(true)
    setError('')
    setCopiedField('')
    setStatus('Creating dashboard account and binding to sample…')
    try {
      const payload = await readJson<{ data: BindAccountData }>(
        await fetch('/api/pilot-session/bind-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sn,
            email,
            nickname: emailNickname(email),
          }),
        }),
        'Bind account failed.',
      )
      if (payload.data.credentials?.email && payload.data.credentials?.password) {
        setCredentials(payload.data.credentials)
      }
      await runResolve(email, sn)
      setStatus(
        payload.data.password_issued
          ? 'Dashboard account ready. Copy login details below before the meeting.'
          : 'Dashboard account ready.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bind account failed.')
      setStatus('')
    } finally {
      setBindingAccount(false)
    }
  }

  const onCopy = async (field: 'email' | 'password' | 'both') => {
    if (!credentials?.email || !credentials?.password) return
    const value =
      field === 'email'
        ? credentials.email
        : field === 'password'
          ? credentials.password
          : `Login: ${credentials.email}\nPassword: ${credentials.password}`
    try {
      await copyText(value)
      setCopiedField(field)
      window.setTimeout(() => setCopiedField(''), 1600)
    } catch {
      setError('Copy failed. Select the text manually.')
    }
  }

  return (
    <main className="prep-shell">
      <header className="prep-header">
        <p className="prep-eyebrow">Internal · pre-meeting only</p>
        <h1>Pilot Plan Prep</h1>
        <p className="prep-lead">Select today&apos;s Calendly meeting, resolve the client SN, then open the screen-share page.</p>
      </header>

      <section className="prep-card">
        <h2>1. Calendly</h2>
        <div className="prep-row">
          <label htmlFor="prep-date">Date</label>
          <input id="prep-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button type="button" onClick={() => void loadEvents()} disabled={loadingEvents}>
            {loadingEvents ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        {events.length === 0 && !loadingEvents ? (
          <p className="prep-muted">No events for this date.</p>
        ) : (
          <ul className="prep-event-list">
            {events.map((event) => (
              <li key={event.uri}>
                <button
                  type="button"
                  className={selectedEventUri === event.uri ? 'is-selected' : ''}
                  onClick={() => onSelectEvent(event.uri)}
                >
                  <strong>{event.name || 'Meeting'}</strong>
                  <span>{formatTime(event.start_time)}</span>
                  <span>{event.invitees.map((i) => i.email).filter(Boolean).join(', ') || 'No invitee email'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="prep-card">
        <h2>2. Resolve client &amp; SN</h2>
        <div className="prep-row">
          <label htmlFor="prep-email">Invitee email</label>
          <input
            id="prep-email"
            type="email"
            value={selectedEmail}
            onChange={(e) => setSelectedEmail(e.target.value)}
            placeholder="from Calendly or manual"
          />
          <button type="button" disabled={!selectedEmail || resolving} onClick={() => void runResolve(selectedEmail)}>
            Resolve
          </button>
        </div>
        <div className="prep-row">
          <label htmlFor="prep-sn">Magnet SN</label>
          <input
            id="prep-sn"
            value={manualSn}
            onChange={(e) => setManualSn(e.target.value)}
            placeholder="NFC Card SN"
          />
          <button
            type="button"
            disabled={!manualSn.trim() || resolving}
            onClick={() => void runResolve(selectedEmail, manualSn.trim())}
          >
            Verify SN
          </button>
        </div>

        {resolve ? (
          <dl className="prep-resolve">
            <div><dt>Match</dt><dd>{resolve.match_level}</dd></div>
            <div><dt>Client</dt><dd>{resolve.client?.title || '—'}</dd></div>
            <div><dt>Keyperson</dt><dd>{resolve.keyperson?.name || '—'}</dd></div>
            <div><dt>Sample</dt><dd>{resolve.sample ? 'Found' : 'Not found'}</dd></div>
            <div><dt>Account</dt><dd>{resolve.customer?.email || 'Not bound'}</dd></div>
          </dl>
        ) : null}

        {warnings.length > 0 ? (
          <ul className="prep-warnings">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}

        {status ? <p className="prep-status">{status}</p> : null}
        {error ? <p className="prep-error">{error}</p> : null}
      </section>

      <section className="prep-card">
        <h2>3. Dashboard account</h2>
        {!accountBound || !hasCredentials ? (
          <div className="prep-row">
            <p className="prep-muted">
              {!inviteeEmail
                ? 'Invitee email required.'
                : !snVerified
                  ? 'Verify SN first (sample must exist).'
                  : accountBound
                    ? 'Account bound, but no stored password yet — issue credentials to save and copy them.'
                    : `Will bind ${inviteeEmail}`}
            </p>
            <button type="button" disabled={!canBind || bindingAccount} onClick={() => void bindAccount()}>
              {bindingAccount ? 'Binding…' : accountBound ? 'Issue credentials' : 'Create & bind'}
            </button>
          </div>
        ) : (
          <p className="prep-status">Bound: {resolve?.customer?.email}</p>
        )}

        {hasCredentials ? (
          <div className="prep-credentials">
            <p className="prep-muted">Save these for sending to the client later. They are also stored on the sample.</p>
            <div className="prep-credential-row">
              <span className="prep-credential-label">Login</span>
              <code className="prep-credential-value">{credentials?.email}</code>
              <button type="button" onClick={() => void onCopy('email')}>
                {copiedField === 'email' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="prep-credential-row">
              <span className="prep-credential-label">Password</span>
              <code className="prep-credential-value">{credentials?.password}</code>
              <button type="button" onClick={() => void onCopy('password')}>
                {copiedField === 'password' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="prep-row">
              <button type="button" onClick={() => void onCopy('both')}>
                {copiedField === 'both' ? 'Copied both' : 'Copy login + password'}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="prep-card">
        <h2>4. Ready for meeting</h2>
        <p className="prep-muted">Open this link when screen-sharing. It hides Calendly and internal matching.</p>
        {readyBlocked ? (
          <p className="prep-error">
            {!resolvedSn
              ? 'Resolve or enter a magnet SN first.'
              : sampleMissing
                ? 'Sample not found in Supabase — add it in lead_data before the meeting.'
                : 'Create and bind a dashboard account before opening the meet page.'}
          </p>
        ) : (
          <div className="prep-row">
            <code className="prep-link">{meetUrl}</code>
            <a className="prep-primary" href={meetUrl}>Open meet page</a>
          </div>
        )}
      </section>

      {selectedEvent ? (
        <p className="prep-footnote">Selected: {selectedEvent.name} · {formatTime(selectedEvent.start_time)}</p>
      ) : null}
    </main>
  )
}
