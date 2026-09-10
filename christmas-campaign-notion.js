/**
 * Christmas ASIN / DTC campaign form → Notion "Christmas Pilot Applications".
 *
 * Env:
 *   NOTION_API_TOKEN (or NOTION_TOKEN)
 *   NOTION_CHRISTMAS_PILOT_DATABASE_ID
 */

const NOTION_VERSION = '2022-06-28'
const DEFAULT_DATABASE_ID = '3d79166f-d9fd-81ef-92fb-f1bcc3b9d431'

const ASIN_PRODUCT_TYPES = new Set([
  'Christmas bundle',
  'Seasonal ASIN',
  'Giftable product',
  'Limited edition product',
  'Existing ASIN with Christmas packaging',
  'Other',
])

const DTC_PRODUCT_TYPES = new Set([
  'Christmas gift box',
  'Seasonal bundle',
  'Limited edition product',
  'Gift-with-purchase',
  'Existing product with Christmas packaging',
  'Corporate gifting',
  'Other',
])

const ASIN_CAMPAIGN_GOALS = new Set([
  'Thank loyal or VIP customers',
  'Launch a Christmas gift box or seasonal bundle',
  'Create a memorable unboxing moment',
  'Increase daily routine exposure at home',
  'Create an Amazon retention touchpoint on the fridge door',
  'Collect zero-party feedback data from Amazon customers',
  'Other',
])

const DTC_CAMPAIGN_GOALS = new Set([
  'Thank loyal or VIP customers',
  'Launch a Christmas gift box or seasonal bundle',
  'Create a memorable unboxing moment',
  'Increase daily routine exposure at home',
  'Create a retention touchpoint on the fridge door',
  'Collect zero-party data from gift recipients',
  'Record taps, interactions, and reorder intent',
  'Other',
])

const DELIVERY_WEEKS = new Set([
  '4th week of October',
  '1st week of November',
  '2nd week of November',
  '3rd week of November',
  '4th week of November',
])

const ASIN_DISTRIBUTION = new Set([
  '5,000–10,000 units',
  '5,000-10,000 units',
  '10,000–50,000 units',
  '10,000-50,000 units',
  '50,000+ units',
])

const DTC_DISTRIBUTION = new Set([
  '1,000–3,000 customers',
  '1,000-3,000 customers',
  '3,000–10,000 customers',
  '3,000-10,000 customers',
  '10,000+ customers',
])

const ASIN_BUDGET = new Set(['$1–$2 per unit', '$2–$2.99+ per unit', '$3+ per unit'])
const DTC_BUDGET = new Set(['$3–$5 per unit', '$5–$10+ per unit', '$10+ per unit'])

const DISTRIBUTION_BAND_MAP = {
  '5,000–10,000 units': '5k–10k units',
  '5,000-10,000 units': '5k–10k units',
  '10,000–50,000 units': '10k–50k units',
  '10,000-50,000 units': '10k–50k units',
  '50,000+ units': '50k+ units',
  '1,000–3,000 customers': '1k–3k customers',
  '1,000-3,000 customers': '1k–3k customers',
  '3,000–10,000 customers': '3k–10k customers',
  '3,000-10,000 customers': '3k–10k customers',
  '10,000+ customers': '10k+ customers',
}

const DISTRIBUTION_RANK_MAP = {
  '5k–10k units': 1,
  '10k–50k units': 2,
  '50k+ units': 3,
  '1k–3k customers': 1,
  '3k–10k customers': 2,
  '10k+ customers': 3,
}

const CAMPAIGN_GOAL_MAP = {
  'Record taps, interactions, and reorder intent': 'Record taps / interactions / reorder intent',
}

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.de',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'yopmail.com',
  'trashmail.com',
  'sharklasers.com',
  'getnada.com',
  'discard.email',
  'maildrop.cc',
  'fakeinbox.com',
])

function notionToken() {
  return process.env.NOTION_API_TOKEN || process.env.NOTION_TOKEN || ''
}

function databaseId() {
  return process.env.NOTION_CHRISTMAS_PILOT_DATABASE_ID || DEFAULT_DATABASE_ID
}

function httpError(status, code, message) {
  const error = new Error(message)
  error.status = status
  error.code = code
  return error
}

function asArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  if (value == null || value === '') return []
  return [String(value).trim()].filter(Boolean)
}

function clampText(value, { min = 1, max = 80, field = 'field' } = {}) {
  const text = String(value || '').trim()
  if (text.length < min || text.length > max) {
    throw httpError(400, 'invalid_field', `${field} must be ${min}-${max} characters.`)
  }
  return text
}

const PLACEHOLDER_FULL_NAMES = new Set([
  'test',
  'asdf',
  'asdfgh',
  'qwerty',
  'n/a',
  'na',
  'none',
  'null',
  'xxx',
  'xxxx',
  'unknown',
  'name',
  'fullname name',
  'full name',
  'your name',
  'abc',
  'abcd',
  'aaa',
  'aaaa',
])

function assertFullName(raw) {
  const name = String(raw || '')
    .trim()
    .replace(/\s+/g, ' ')

  if (name.length < 2 || name.length > 80) {
    throw httpError(400, 'invalid_field', 'Please enter your real full name.')
  }
  // Letters (incl. accents), combining marks, spaces, apostrophe, hyphen, middle dot, period.
  if (!/^[\p{L}\p{M} '\-·.]+$/u.test(name)) {
    throw httpError(400, 'invalid_field', 'Please enter your real full name.')
  }
  if (!/\p{L}/u.test(name)) {
    throw httpError(400, 'invalid_field', 'Please enter your real full name.')
  }
  if (/(.)\1{3,}/u.test(name)) {
    throw httpError(400, 'invalid_field', 'Please enter your real full name.')
  }
  if (PLACEHOLDER_FULL_NAMES.has(name.toLowerCase())) {
    throw httpError(400, 'invalid_field', 'Please enter your real full name.')
  }
  return name
}

function richText(content) {
  const text = String(content || '')
  if (!text) return { rich_text: [] }
  return { rich_text: [{ type: 'text', text: { content: text.slice(0, 1900) } }] }
}

function mapDistributionBand(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  if (DISTRIBUTION_BAND_MAP[value]) return DISTRIBUTION_BAND_MAP[value]
  if (Object.values(DISTRIBUTION_BAND_MAP).includes(value)) return value
  return value
}

function mapCampaignGoals(values) {
  return asArray(values).map((goal) => CAMPAIGN_GOAL_MAP[goal] || goal)
}

function normalizeHttpUrl(raw, field) {
  const value = String(raw || '').trim()
  if (!value) return null
  if (value.length > 500) {
    throw httpError(400, 'invalid_field', `${field} is too long.`)
  }
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  let parsed
  try {
    parsed = new URL(withProtocol)
  } catch {
    throw httpError(400, 'invalid_field', `${field} must be a valid URL.`)
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw httpError(400, 'invalid_field', `${field} must be an http(s) URL.`)
  }
  return parsed.toString()
}

function assertAllowedSet(values, allowed, field) {
  const list = asArray(values)
  if (!list.length) {
    throw httpError(400, 'missing_guided_inputs', `${field} is required.`)
  }
  if (list.length > allowed.size) {
    throw httpError(400, 'invalid_field', `${field} has too many values.`)
  }
  for (const item of list) {
    if (!allowed.has(item)) {
      throw httpError(400, 'invalid_field', `${field} contains an invalid option.`)
    }
  }
  return list
}

function assertEmail(emailRaw) {
  const email = String(emailRaw || '').trim().toLowerCase()
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw httpError(400, 'invalid_email', 'A valid work email is required.')
  }
  const domain = email.split('@')[1] || ''
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    throw httpError(400, 'invalid_email', 'Please use a work email address.')
  }
  return email
}

function assertPhone(phoneRaw) {
  const phone = String(phoneRaw || '').trim()
  if (!/^[+0-9()\-.\s]{6,30}$/.test(phone)) {
    throw httpError(400, 'invalid_field', 'Phone must be 6-30 characters and use digits or +()- .')
  }
  return phone
}

function validateApplication(body) {
  const channel = String(body.channel || '').trim().toUpperCase()
  if (channel !== 'ASIN' && channel !== 'DTC') {
    throw httpError(400, 'invalid_channel', 'channel must be ASIN or DTC.')
  }

  const fullName = assertFullName(body.fullName)
  const title = clampText(body.title, { field: 'Title' })
  const phone = assertPhone(body.phone)
  const email = assertEmail(body.email)
  const brand = clampText(body.brand, { field: 'Brand Name' })
  const website = normalizeHttpUrl(body.website, 'Website')
  if (!website) throw httpError(400, 'missing_contact', 'Website is required.')

  let asinUrl = null
  if (channel === 'ASIN') {
    asinUrl = normalizeHttpUrl(body.asinUrl, 'Amazon Storefront / ASIN Link')
    if (!asinUrl) throw httpError(400, 'missing_asin_url', 'Amazon Storefront / ASIN link is required.')
  }

  const productTypes = assertAllowedSet(
    body.productTypes || body.productType,
    channel === 'ASIN' ? ASIN_PRODUCT_TYPES : DTC_PRODUCT_TYPES,
    'Product type',
  )
  const campaignGoalsRaw = assertAllowedSet(
    body.campaignGoals || body.campaignGoal,
    channel === 'ASIN' ? ASIN_CAMPAIGN_GOALS : DTC_CAMPAIGN_GOALS,
    'Campaign goal',
  )
  const campaignGoals = mapCampaignGoals(campaignGoalsRaw)

  const distributionRaw = String(body.distribution || '').trim()
  const allowedDistribution = channel === 'ASIN' ? ASIN_DISTRIBUTION : DTC_DISTRIBUTION
  if (!allowedDistribution.has(distributionRaw)) {
    throw httpError(400, 'invalid_field', 'Distribution option is invalid.')
  }
  const distributionBand = mapDistributionBand(distributionRaw)

  const deliveryWeek = String(body.delivery || '').trim()
  if (!DELIVERY_WEEKS.has(deliveryWeek)) {
    throw httpError(400, 'invalid_field', 'Delivery week is invalid.')
  }

  const budgetBand = String(body.budget || '').trim()
  const allowedBudget = channel === 'ASIN' ? ASIN_BUDGET : DTC_BUDGET
  if (!allowedBudget.has(budgetBand)) {
    throw httpError(400, 'invalid_field', 'Budget option is invalid.')
  }

  return {
    channel,
    fullName,
    title,
    phone,
    email,
    brand,
    website,
    asinUrl,
    productTypes,
    campaignGoals,
    distributionBand,
    distributionRank: DISTRIBUTION_RANK_MAP[distributionBand] || null,
    deliveryWeek,
    budgetBand,
    sourcePage: channel === 'ASIN' ? 'ASIN Campaign' : 'DTC Campaign',
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
  const properties = {
    'Application Title': {
      title: [{ type: 'text', text: { content: `${application.brand} — ${application.fullName}`.slice(0, 200) } }],
    },
    Channel: { select: { name: application.channel } },
    Status: { select: { name: 'New' } },
    'Full Name': richText(application.fullName),
    Title: richText(application.title),
    Phone: { phone_number: application.phone.slice(0, 30) },
    Email: { email: application.email },
    Brand: richText(application.brand),
    Website: { url: application.website },
    'Product Types': { multi_select: application.productTypes.map((name) => ({ name })) },
    'Campaign Goals': { multi_select: application.campaignGoals.map((name) => ({ name })) },
    'Distribution Band': { select: { name: application.distributionBand } },
    'Delivery Week': { select: { name: application.deliveryWeek } },
    'Budget Band': { select: { name: application.budgetBand } },
    'Source Page': { select: { name: application.sourcePage } },
    'Submitted At': { date: { start: submittedAt } },
    'Raw Payload': richText(JSON.stringify(application)),
  }

  if (application.asinUrl) {
    properties['ASIN / Storefront URL'] = { url: application.asinUrl }
  }
  if (application.distributionRank != null) {
    properties['Distribution Rank'] = { number: application.distributionRank }
  }

  return properties
}

async function createChristmasCampaignApplication(body) {
  const application = validateApplication(body)
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
    channel: application.channel,
    email: application.email,
  }
}

module.exports = {
  createChristmasCampaignApplication,
  mapDistributionBand,
  mapCampaignGoals,
  validateApplication,
}
