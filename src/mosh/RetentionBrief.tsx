import { useState, type FormEvent } from 'react'
import { PencilLine, Send } from 'lucide-react'
import { fetchAboutPilotFormToken } from '../../meeting-intake/client/submitApplication'
import './RetentionBrief.css'

type AnswerField = {
  name: string
  label: string
  placeholder: string
  mode: 'numeric' | 'decimal' | 'text' | 'email'
  prefix?: string
  suffix?: string
  type?: 'text' | 'email'
}

const questions: { text: string; fields: AnswerField[] }[] = [
  {
    text: 'How many DTC orders do you receive each month?',
    fields: [{ name: 'monthlyOrders', label: 'DTC orders each month', placeholder: 'Enter number', mode: 'numeric', suffix: 'orders / month' }],
  },
  {
    text: 'How many of those orders come from subscribers?',
    fields: [{ name: 'subscriberOrders', label: 'Orders from subscribers', placeholder: 'Enter number', mode: 'numeric', suffix: 'orders' }],
  },
  {
    text: 'Of the orders from non-subscribers, how many come from first-time customers?',
    fields: [{ name: 'firstOrders', label: 'Orders from first-time customers', placeholder: 'Enter number', mode: 'numeric', suffix: 'orders' }],
  },
  {
    text: 'How many active subscribers do you currently have? About how many do you add each month?',
    fields: [
      { name: 'activeSubscribers', label: 'Active subscribers', placeholder: 'Enter', mode: 'numeric', suffix: 'active' },
      { name: 'newSubscribers', label: 'Subscribers added each month', placeholder: 'Enter', mode: 'numeric', suffix: 'added / month' },
    ],
  },
  {
    text: 'What is your average DTC order value?',
    fields: [{ name: 'orderValue', label: 'Average DTC order value', placeholder: 'Enter amount', mode: 'decimal', prefix: '$', suffix: 'per order' }],
  },
  {
    text: 'What percentage of your existing DTC customers would you like to reach with Hommio, and by when?',
    fields: [
      { name: 'reach', label: 'Percentage of DTC customers to reach', placeholder: 'Enter', mode: 'decimal', suffix: '%' },
      { name: 'deadline', label: 'When to reach those customers', placeholder: 'Month or quarter', mode: 'text', prefix: 'by' },
    ],
  },
  {
    text: 'What budget do you have in mind for this project in 2027?',
    fields: [{ name: 'budget', label: 'Project budget in 2027', placeholder: 'Enter amount', mode: 'decimal', prefix: '$' }],
  },
]

const contactFields: AnswerField[] = [
  { name: 'contactName', label: 'Your name', placeholder: 'Optional', mode: 'text' },
  { name: 'contactEmail', label: 'Work email', placeholder: 'Optional', mode: 'email', type: 'email' },
]

type RetentionBriefProps = {
  brand?: string
}

export function RetentionBrief({ brand = 'MOSH' }: RetentionBriefProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const completed = questions.filter(({ fields }) => fields.every(({ name }) => answers[name]?.trim())).length
  const started = Object.values(answers).some(value => value.trim())

  async function submitAnswers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!started || status === 'submitting') return

    setStatus('submitting')
    setMessage('Saving your answers…')

    try {
      const formToken = await fetchAboutPilotFormToken('/api/retention-brief/form-token')
      const response = await fetch('/api/retention-brief/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          sourcePage: brand,
          formToken,
          answers,
          contactName: answers.contactName || '',
          contactEmail: answers.contactEmail || '',
        }),
      })
      const result = await response.json().catch(() => ({})) as {
        ok?: boolean
        error?: string
        pageId?: string
      }
      if (!response.ok || !result.ok || !result.pageId) {
        throw new Error(result.error || "We couldn't save your answers. Please try again.")
      }
      setStatus('success')
      setMessage('Saved. Hommio will use these answers to shape your retention plan.')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : "We couldn't save your answers. Please try again.")
    }
  }

  return (
    <form className="retention-brief" aria-labelledby="slide-04-title" onSubmit={submitAnswers}>
      <header className="brief-heading">
        <div>
          <h2 id="slide-04-title">Questions to Shape Your Customized Retention Plan</h2>
          <p>To develop a plan tailored to your brand, we’d like to understand:</p>
        </div>
        <PencilLine className="brief-pencil" size={36} strokeWidth={1.5} aria-hidden="true" />
      </header>
      <div className="brief-questions">
        {questions.map(({ text, fields }, index) => {
          const questionId = 'brief-question-' + (index + 1)
          return (
            <div className="brief-question" key={questionId} role="group" aria-labelledby={questionId}>
              <span className="brief-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <h3 id={questionId}>{text}</h3>
              <div className="brief-fields">
                {fields.map(({ name, label, prefix, suffix, placeholder, mode }) => (
                  <label className="brief-field" key={name}>
                    {prefix && <span aria-hidden="true">{prefix}</span>}
                    <input type="text" name={name} aria-label={label} inputMode={mode === 'email' ? 'email' : mode}
                      placeholder={placeholder} value={answers[name] ?? ''}
                      onChange={event => setAnswers({ ...answers, [name]: event.target.value })}
                      disabled={status === 'submitting' || status === 'success'} />
                    {suffix && <span aria-hidden="true">{suffix}</span>}
                  </label>
                ))}
              </div>
            </div>
          )
        })}
        <div className="brief-question" role="group" aria-labelledby="brief-contact-title">
          <span className="brief-number" aria-hidden="true">+</span>
          <h3 id="brief-contact-title">Who should we follow up with? (optional)</h3>
          <div className="brief-fields">
            {contactFields.map(({ name, label, placeholder, mode, type }) => (
              <label className="brief-field" key={name}>
                <input type={type || 'text'} name={name} aria-label={label} inputMode={mode}
                  placeholder={placeholder} value={answers[name] ?? ''}
                  onChange={event => setAnswers({ ...answers, [name]: event.target.value })}
                  disabled={status === 'submitting' || status === 'success'} />
              </label>
            ))}
          </div>
        </div>
      </div>
      <footer className="brief-footer">
        <div className="brief-progress">
          <progress aria-label="Questions answered" value={completed} max={questions.length} />
          <span role="status">{completed} of {questions.length} answered</span>
        </div>
        <div className="brief-submit">
          {message && (
            <p className={`brief-status${status === 'error' ? ' is-error' : ''}`} role="status">{message}</p>
          )}
          <button type="submit" disabled={!started || status === 'submitting' || status === 'success'}>
            <Send size={18} aria-hidden="true" />
            {status === 'submitting' ? 'Saving…' : status === 'success' ? 'Saved' : 'Submit'}
          </button>
        </div>
      </footer>
    </form>
  )
}
