/**
 * Brand retention-brief answers → Notion "FC3.0-RetentionBriefDB".
 *
 * Env:
 *   NOTION_API_TOKEN (or NOTION_TOKEN)
 *   NOTION_RETENTION_BRIEF_DATABASE_ID
 */

const NOTION_VERSION = '2022-06-28'
const DEFAULT_DATABASE_ID = '4219166f-d9fd-8166-82e3-e1991ce0e382'

const BRANDS = new Set(['MOSH', 'Gourmend', 'GardenCup', 'Other'])

const FIELD_LIMIT = 120

function httpError(status, code, message) {
  const error = new Error(message)
  error.status = status
  error.code = code
  return error
}

function notionToken() {
  return process.env.NOTION_API_TOKEN || process.env.NOTION_TOKEN || ''
}

function databaseId() {
  return String(process.env.NOTION_RETENTION_BRIEF_DATABASE_ID || DEFAULT_DATABASE_ID).trim()
}

function richText(value) {
  const text = String(value || '').trim()
  if (!text) return { rich_text: [] }
  return { rich_text: [{ type: 'text', text: { content: text.slice(0, 1900) } }] }
}

function cleanField(value, label) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (text.length > FIELD_LIMIT) {
    throw httpError(400, 'invalid_field', `${label} is too long.`)
  }
  return text
}

function normalizeBrand(raw) {
  const value = String(raw || '').trim()
  if (!value) return 'Other'
  if (BRANDS.has(value)) return value
  const upper = value.toUpperCase()
  if (upper === 'MOSH') return 'MOSH'
  if (upper === 'GOURMEND' || upper === 'GOURMENDFOODS') return 'Gourmend'
  if (upper === 'GARDENCUP') return 'GardenCup'
  return 'Other'
}

function assertEmailOptional(emailRaw) {
  const email = String(emailRaw || '').trim().toLowerCase()
  if (!email) return ''
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw httpError(400, 'invalid_email', 'Please enter a valid email address.')
  }
  return email
}

function validateRetentionBrief(body) {
  const brand = normalizeBrand(body.brand || body.sourcePage)
  const sourcePage = normalizeBrand(body.sourcePage || brand)
  const answers = body.answers && typeof body.answers === 'object' ? body.answers : body

  const monthlyOrders = cleanField(answers.monthlyOrders, 'Monthly DTC orders')
  const subscriberOrders = cleanField(answers.subscriberOrders, 'Subscriber orders')
  const firstOrders = cleanField(answers.firstOrders, 'First-time orders')
  const activeSubscribers = cleanField(answers.activeSubscribers, 'Active subscribers')
  const newSubscribers = cleanField(answers.newSubscribers, 'New subscribers / month')
  const orderValue = cleanField(answers.orderValue, 'Average DTC order value')
  const reach = cleanField(answers.reach, 'Reach percentage')
  const deadline = cleanField(answers.deadline, 'Reach deadline')
  const budget = cleanField(answers.budget, 'Budget 2027')
  const contactName = cleanField(answers.contactName || body.contactName, 'Contact name')
  const contactEmail = assertEmailOptional(answers.contactEmail || body.contactEmail)

  const filled = [
    monthlyOrders,
    subscriberOrders,
    firstOrders,
    activeSubscribers,
    newSubscribers,
    orderValue,
    reach,
    deadline,
    budget,
    contactName,
    contactEmail,
  ].filter(Boolean)

  if (!filled.length) {
    throw httpError(400, 'missing_answers', 'Please answer at least one question before submitting.')
  }

  return {
    brand,
    sourcePage,
    monthlyOrders,
    subscriberOrders,
    firstOrders,
    activeSubscribers,
    newSubscribers,
    orderValue,
    reach,
    deadline,
    budget,
    contactName,
    contactEmail,
  }
}

async function notionFetch(pathname, { method = 'GET', body } = {}) {
  const token = notionToken()
  if (!token) {
    throw httpError(500, 'notion_token_missing', 'NOTION_API_TOKEN is not configured.')
  }

  const response = await fetch(`https://api.notion.com/v1${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = httpError(
      response.status >= 500 ? 502 : response.status,
      payload.code || 'notion_api_error',
      payload.message || `Notion API error (${response.status}).`,
    )
    error.details = payload
    throw error
  }
  return payload
}

function buildNotionProperties(application) {
  const submittedAt = new Date().toISOString()
  const who = application.contactName || application.contactEmail || 'Meeting answers'
  const title = `${application.brand} — Retention brief — ${who}`.slice(0, 200)

  const properties = {
    'Application Title': {
      title: [{ type: 'text', text: { content: title } }],
    },
    Brand: { select: { name: application.brand } },
    'Source Page': { select: { name: application.sourcePage } },
    Status: { select: { name: 'New' } },
    'Submitted At': { date: { start: submittedAt } },
    'Monthly DTC Orders': richText(application.monthlyOrders),
    'Subscriber Orders': richText(application.subscriberOrders),
    'First-time Orders': richText(application.firstOrders),
    'Active Subscribers': richText(application.activeSubscribers),
    'New Subscribers / Month': richText(application.newSubscribers),
    'Average DTC Order Value': richText(application.orderValue),
    'Reach Percentage': richText(application.reach),
    'Reach Deadline': richText(application.deadline),
    'Budget 2027': richText(application.budget),
    'Contact Name': richText(application.contactName),
    'Raw Payload': richText(JSON.stringify(application)),
  }

  if (application.contactEmail) {
    properties['Contact Email'] = { email: application.contactEmail }
  }

  return properties
}

async function createRetentionBriefApplication(body) {
  const application = validateRetentionBrief(body)
  const page = await notionFetch('/pages', {
    method: 'POST',
    body: {
      parent: { database_id: databaseId() },
      properties: buildNotionProperties(application),
    },
  })

  return {
    ok: true,
    pageId: page.id,
    url: page.url || null,
    brand: application.brand,
    email: application.contactEmail || null,
  }
}

module.exports = {
  createRetentionBriefApplication,
  validateRetentionBrief,
}
