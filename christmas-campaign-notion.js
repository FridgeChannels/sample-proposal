/**
 * Christmas ASIN / DTC campaign form → Notion "Christmas Pilot Applications".
 *
 * Env:
 *   NOTION_API_TOKEN (or NOTION_TOKEN)
 *   NOTION_CHRISTMAS_PILOT_DATABASE_ID
 */

const NOTION_VERSION = '2022-06-28'
const DEFAULT_DATABASE_ID = '3d79166f-d9fd-81ef-92fb-f1bcc3b9d431'

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

function notionToken() {
  return process.env.NOTION_API_TOKEN || process.env.NOTION_TOKEN || ''
}

function databaseId() {
  return process.env.NOTION_CHRISTMAS_PILOT_DATABASE_ID || DEFAULT_DATABASE_ID
}

function asArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  if (value == null || value === '') return []
  return [String(value).trim()].filter(Boolean)
}

function richText(content) {
  const text = String(content || '')
  if (!text) return { rich_text: [] }
  // Notion rich_text items max ~2000 chars; keep payloads bounded.
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

function normalizeWebsite(url) {
  const value = String(url || '').trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

function validateApplication(body) {
  const channel = String(body.channel || '').trim().toUpperCase()
  if (channel !== 'ASIN' && channel !== 'DTC') {
    const error = new Error('channel must be ASIN or DTC.')
    error.status = 400
    error.code = 'invalid_channel'
    throw error
  }

  const fullName = String(body.fullName || '').trim()
  const title = String(body.title || '').trim()
  const phone = String(body.phone || '').trim()
  const email = String(body.email || '').trim()
  const brand = String(body.brand || '').trim()
  const website = normalizeWebsite(body.website)
  const asinUrl = String(body.asinUrl || '').trim() || null
  const productTypes = asArray(body.productTypes || body.productType)
  const campaignGoals = mapCampaignGoals(body.campaignGoals || body.campaignGoal)
  const distributionBand = mapDistributionBand(body.distribution)
  const deliveryWeek = String(body.delivery || '').trim()
  const budgetBand = String(body.budget || '').trim()

  if (!fullName || !title || !phone || !email || !brand || !website) {
    const error = new Error('Contact fields are required.')
    error.status = 400
    error.code = 'missing_contact'
    throw error
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('A valid work email is required.')
    error.status = 400
    error.code = 'invalid_email'
    throw error
  }
  if (channel === 'ASIN' && !asinUrl) {
    const error = new Error('Amazon Storefront / ASIN link is required.')
    error.status = 400
    error.code = 'missing_asin_url'
    throw error
  }
  if (!productTypes.length || !campaignGoals.length || !distributionBand || !deliveryWeek || !budgetBand) {
    const error = new Error('All guided pilot questions are required.')
    error.status = 400
    error.code = 'missing_guided_inputs'
    throw error
  }

  return {
    channel,
    fullName,
    title,
    phone,
    email,
    brand,
    website,
    asinUrl: channel === 'ASIN' ? asinUrl : null,
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
    const error = new Error('NOTION_API_TOKEN is not configured.')
    error.status = 500
    error.code = 'notion_token_missing'
    throw error
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
    const error = new Error(payload.message || `Notion API error (${response.status}).`)
    error.status = response.status >= 500 ? 502 : response.status
    error.code = payload.code || 'notion_api_error'
    error.details = payload
    throw error
  }
  return payload
}

function buildNotionProperties(application) {
  const submittedAt = new Date().toISOString()
  const properties = {
    Name: {
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
  }
}

module.exports = {
  createChristmasCampaignApplication,
  mapDistributionBand,
  mapCampaignGoals,
  validateApplication,
}
