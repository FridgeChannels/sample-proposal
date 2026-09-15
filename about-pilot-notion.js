/**
 * DTC / Amazon About form → Notion "FC3.0-AboutPilotDB".
 *
 * Env:
 *   NOTION_API_TOKEN (or NOTION_TOKEN)
 *   NOTION_ABOUT_PILOT_DATABASE_ID
 */

const NOTION_VERSION = '2022-06-28'
const DEFAULT_DATABASE_ID = '3dc9166f-d9fd-81e2-a74b-d861bb100dec'

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

const DTC_RETENTION = new Set([
  'Increase customer lifetime value (LTV)',
  'Convert one-time buyers into subscribers',
  'Increase repeat purchases among existing customers',
  'Increase purchases of additional products among subscribers',
  'Increase customer engagement between purchases',
  'Other — please specify',
])

const DTC_STRATEGIC = new Set([
  "Own a physical brand presence in the customer's home",
  'Own the path to the next purchase through your own channel, not Google, Amazon, or AI search',
  'Earn 10+ daily brand exposure without paying per impression',
  'Stay top of mind between purchases',
  'Re-engage customers without email, SMS, or paid ads',
])

const MONTHLY_ORDERS = new Set(['Under 100', '100–500', '501–2,000', '2,001–10,000', 'More than 10,000'])
const AOV_OPTIONS = new Set(['Under US$25', 'US$25–49', 'US$50–99', 'US$100–199', 'US$200 or more'])
const DTC_FULFILLMENT = new Set([
  'In-house fulfillment and shipping',
  'Third-party logistics (3PL) fulfillment and shipping',
  'Hybrid fulfillment: in-house and 3PL',
  'Other — please specify',
])
const INSERT_CAPABILITY = new Set(['Yes', 'No', 'Not sure', 'Not applicable'])
const BUSINESS_MODELS = new Set([
  'Standard one-time purchase',
  'Subscription or recurring purchase',
  'Both one-time purchase and subscription',
  'Other — please specify',
])
const SUBSCRIBERS = new Set(['Under 500', '501–2,000', '2,001–10,000', 'More than 10,000'])

const AMAZON_GOALS = new Set([
  'Reach every household your products ship to, even through resellers',
  'Redirect reseller-driven customers to your Brand Storefront',
  'Own a zero-search path to the next purchase — not Amazon search or competitors',
  'Grow Amazon LTV through refills, bundles, and Subscribe & Save',
  'Own the customer relationship beyond Amazon, updatable anytime',
])

const SELLER_SITUATIONS = new Set([
  'No — our brand is the only seller',
  'Yes — authorized distributors or resellers',
  'Yes — unauthorized sellers (if known)',
])

const BRAND_REGISTRY = new Set(['Yes', 'No', 'In progress / not sure'])
const INSERT_TYPES = new Set(['None', 'QR code insert', 'NFC / smart product insert', 'Other (describe)'])
const AMAZON_FULFILLMENT = new Set([
  'Fulfilled by Amazon (FBA)',
  'Fulfilled directly by the brand (FBM)',
  'Fulfilled by a third-party logistics provider (3PL)',
])
const UNIT_BUCKETS = new Set(['Under 100', '100–500', '501–2,000', '2,001–10,000', 'More than 10,000'])

const MONTHLY_ORDER_MAP = {
  'Under 100': 'Under 100',
  '100–500': '100–500',
  '501–2,000': '501–2000',
  '2,001–10,000': '2001–10000',
  'More than 10,000': 'More than 10000',
}

const AOV_MAP = {
  'Under US$25': 'Under US$25',
  'US$25–49': 'US$25–49',
  'US$50–99': 'US$50–99',
  'US$100–199': 'US$100–199',
  'US$200 or more': 'US$200 or more',
}

const SUBSCRIBER_MAP = {
  'Under 500': 'Under 500',
  '501–2,000': '501–2000',
  '2,001–10,000': '2001–10000',
  'More than 10,000': 'More than 10000',
}

/** Notion select/multi_select option names cannot contain commas — map form labels → Notion labels. */
const STRATEGIC_GOAL_MAP = {
  "Own a physical brand presence in the customer's home":
    'Own a physical brand presence in the customer home',
  'Own the path to the next purchase through your own channel, not Google, Amazon, or AI search':
    'Own the path to the next purchase through your own channel — not Google Amazon or AI search',
  'Earn 10+ daily brand exposure without paying per impression':
    'Earn 10+ daily brand exposure without paying per impression',
  'Stay top of mind between purchases':
    'Stay top of mind between purchases',
  'Re-engage customers without email, SMS, or paid ads':
    'Re-engage customers without email SMS or paid ads',
}

const BUSINESS_GOAL_MAP = {
  'Reach every household your products ship to, even through resellers':
    'Reach every household your products ship to even through resellers',
  'Redirect reseller-driven customers to your Brand Storefront':
    'Redirect reseller-driven customers to your Brand Storefront',
  'Own a zero-search path to the next purchase — not Amazon search or competitors':
    'Own a zero-search path to the next purchase — not Amazon search or competitors',
  'Grow Amazon LTV through refills, bundles, and Subscribe & Save':
    'Grow Amazon LTV through refills bundles and Subscribe & Save',
  'Own the customer relationship beyond Amazon, updatable anytime':
    'Own the customer relationship beyond Amazon updatable anytime',
}

const PLACEHOLDER_FULL_NAMES = new Set([
  'test', 'asdf', 'asdfgh', 'qwerty', 'n/a', 'na', 'none', 'null',
  'xxx', 'xxxx', 'unknown', 'name', 'full name', 'your name', 'abc', 'abcd', 'aaa', 'aaaa',
])

function mapOption(value, map) {
  const key = String(value || '').trim()
  return map[key] || key
}

function mapOptions(values, map) {
  return asArray(values).map((value) => mapOption(value, map))
}

function selectProp(name) {
  return name ? { select: { name } } : undefined
}

function multiSelectProp(names) {
  const list = asArray(names)
  if (!list.length) return undefined
  return { multi_select: list.map((name) => ({ name })) }
}

function notionToken() {
  return process.env.NOTION_API_TOKEN || process.env.NOTION_TOKEN || ''
}

function databaseId() {
  return process.env.NOTION_ABOUT_PILOT_DATABASE_ID || DEFAULT_DATABASE_ID
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

function clampText(value, { min = 1, max = 120, field = 'field' } = {}) {
  const text = String(value || '').trim()
  if (text.length < min || text.length > max) {
    throw httpError(400, 'invalid_field', `${field} must be ${min}-${max} characters.`)
  }
  return text
}

function richText(content) {
  const text = String(content || '')
  if (!text) return { rich_text: [] }
  return { rich_text: [{ type: 'text', text: { content: text.slice(0, 1900) } }] }
}

function assertFullName(raw) {
  const name = String(raw || '')
    .trim()
    .replace(/\s+/g, ' ')
  if (name.length < 2 || name.length > 80) {
    throw httpError(400, 'invalid_field', 'Please enter your real full name.')
  }
  if (!/^[\p{L}\p{M} '\-·.]+$/u.test(name) || !/\p{L}/u.test(name)) {
    throw httpError(400, 'invalid_field', 'Please enter your real full name.')
  }
  if (/(.)\1{3,}/u.test(name) || PLACEHOLDER_FULL_NAMES.has(name.toLowerCase())) {
    throw httpError(400, 'invalid_field', 'Please enter your real full name.')
  }
  return name
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

function normalizeHttpUrl(raw, field) {
  const value = String(raw || '').trim()
  if (!value) return null
  if (value.length > 500) throw httpError(400, 'invalid_field', `${field} is too long.`)
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

function assertAllowedSet(values, allowed, field, { min = 1, max = allowed.size } = {}) {
  const list = asArray(values)
  if (list.length < min) throw httpError(400, 'missing_guided_inputs', `${field} is required.`)
  if (list.length > max) throw httpError(400, 'invalid_field', `${field} has too many values.`)
  for (const item of list) {
    if (!allowed.has(item)) throw httpError(400, 'invalid_field', `${field} contains an invalid option.`)
  }
  return list
}

function assertSelect(value, allowed, field) {
  const text = String(value || '').trim()
  if (!allowed.has(text)) throw httpError(400, 'invalid_field', `${field} is invalid.`)
  return text
}

function normalizeChannel(raw) {
  const value = String(raw || '').trim().toUpperCase()
  if (value === 'DTC') return 'DTC'
  if (value === 'AMAZON' || value === 'ASIN' || value === 'ASIN_PLUS') return 'Amazon'
  throw httpError(400, 'invalid_channel', 'channel must be DTC or Amazon.')
}

function validateDtc(body, channel) {
  const retention = assertAllowedSet(body.retentionOutcomes || body.retention, DTC_RETENTION, 'Retention outcomes')
  const retentionOther = String(body.retentionOther || '').trim()
  if (retention.includes('Other — please specify') && retentionOther.length < 2) {
    throw httpError(400, 'invalid_field', 'Please specify the other retention outcome.')
  }

  const strategic = assertAllowedSet(body.strategicGoals || body.strategic, DTC_STRATEGIC, 'Strategic goals')
  const monthlyOrders = assertSelect(body.monthlyOrders || body.monthlyOrder, MONTHLY_ORDERS, 'Monthly DTC orders')
  const aov = assertSelect(body.aov, AOV_OPTIONS, 'AOV')
  const fulfillment = assertSelect(body.fulfillmentModel || body.fulfillment, DTC_FULFILLMENT, 'Fulfillment model')
  const fulfillmentOther = String(body.fulfillmentOther || '').trim()
  if (fulfillment === 'Other — please specify' && fulfillmentOther.length < 2) {
    throw httpError(400, 'invalid_field', 'Please specify the fulfillment model.')
  }

  const uses3pl = fulfillment.includes('3PL')
  let insertCapability = ''
  if (uses3pl) {
    insertCapability = assertSelect(body.insertCapability, INSERT_CAPABILITY, 'Insert capability')
  }

  const businessModel = assertSelect(body.businessModel, BUSINESS_MODELS, 'Business model')
  const businessOther = String(body.businessOther || '').trim()
  if (businessModel === 'Other — please specify' && businessOther.length < 2) {
    throw httpError(400, 'invalid_field', 'Please specify the business model.')
  }

  const hasSubscription = businessModel.includes('Subscription') || businessModel.includes('Both')
  let activeSubscribers = ''
  if (hasSubscription) {
    activeSubscribers = assertSelect(body.activeSubscribers || body.subscribers, SUBSCRIBERS, 'Active subscribers')
  }

  return {
    channel,
    sourcePage: 'About FridgeChannel',
    retentionOutcomes: retention,
    retentionOther,
    strategicGoals: strategic,
    monthlyOrders,
    aov,
    fulfillmentModel: fulfillment,
    fulfillmentOther,
    insertCapability: insertCapability || null,
    businessModel,
    businessOther,
    activeSubscribers: activeSubscribers || null,
  }
}

function validateAmazon(body, channel) {
  const businessGoals = assertAllowedSet(body.businessGoals || body.goals, AMAZON_GOALS, 'Business goals', { max: 3 })
  const productsRaw = Array.isArray(body.products) ? body.products : []
  if (!productsRaw.length) throw httpError(400, 'missing_guided_inputs', 'At least one product is required.')
  if (productsRaw.length > 5) throw httpError(400, 'invalid_field', 'At most 5 products are allowed.')

  const products = productsRaw.map((item, index) => {
    const asin = String(item?.asin || '').trim()
    if (!asin || asin.length > 300) {
      throw httpError(400, 'invalid_field', `Product ${index + 1} ASIN/URL is invalid.`)
    }
    const unitMode = String(item?.unitMode || '').trim()
    if (unitMode !== 'exact' && unitMode !== 'range') {
      throw httpError(400, 'invalid_field', `Product ${index + 1} units mode is invalid.`)
    }
    if (unitMode === 'exact') {
      const exact = String(item?.exactUnits || '').trim()
      if (!/^\d{1,9}$/.test(exact)) {
        throw httpError(400, 'invalid_field', `Product ${index + 1} exact units is invalid.`)
      }
      return { asin, unitMode, exactUnits: exact, rangeUnits: null }
    }
    const rangeUnits = assertSelect(item?.rangeUnits, UNIT_BUCKETS, `Product ${index + 1} unit range`)
    return { asin, unitMode, exactUnits: null, rangeUnits }
  }).filter((item) => item.asin)

  if (!products.length) throw httpError(400, 'missing_guided_inputs', 'At least one product is required.')

  const otherSellers = assertSelect(body.otherSellers || body.sellers, SELLER_SITUATIONS, 'Other sellers')
  const brandRegistry = assertSelect(body.brandRegistry || body.registry, BRAND_REGISTRY, 'Brand Registry')
  const packageInserts = asArray(body.packageInserts || body.insertTypes)
  for (const item of packageInserts) {
    if (!INSERT_TYPES.has(item)) throw httpError(400, 'invalid_field', 'Package inserts contains an invalid option.')
  }
  const insertOther = String(body.insertOther || '').trim()
  if (packageInserts.includes('Other (describe)') && insertOther.length < 2) {
    throw httpError(400, 'invalid_field', 'Please describe the package insert.')
  }

  const storefront = normalizeHttpUrl(body.amazonStorefront || body.storefront, 'Amazon Storefront URL')
  if (!storefront) throw httpError(400, 'missing_contact', 'Amazon Storefront URL is required.')

  const amazonFulfillment = assertAllowedSet(
    body.amazonFulfillment || body.fulfillment,
    AMAZON_FULFILLMENT,
    'Amazon fulfillment',
  )

  return {
    channel,
    sourcePage: 'FC ASIN+ Sample',
    amazonStorefront: storefront,
    businessGoals,
    products,
    otherSellers,
    brandRegistry,
    packageInserts,
    insertOther,
    manufacturingLocation: String(body.manufacturingLocation || body.manufacturing || '').trim().slice(0, 500),
    amazonFulfillment,
  }
}

function validateApplication(body) {
  const channel = normalizeChannel(body.channel)
  const fullName = assertFullName(body.fullName)
  const title = clampText(body.title, { field: 'Title' })
  const email = assertEmail(body.email)
  const website = normalizeHttpUrl(body.website, 'Website')
  if (!website) throw httpError(400, 'missing_contact', 'Website is required.')
  const magnetSn = String(body.magnetSn || body.sn || '').trim().slice(0, 80)

  const shared = { channel, fullName, title, email, website, magnetSn: magnetSn || null }
  const guided = channel === 'DTC' ? validateDtc(body, channel) : validateAmazon(body, channel)
  return { ...shared, ...guided }
}

async function notionFetch(pathname, { method = 'GET', body } = {}) {
  const token = notionToken()
  if (!token) throw httpError(500, 'notion_token_missing', 'NOTION_API_TOKEN is not configured.')

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

function formatProducts(products) {
  return (products || []).map((product) => {
    const units = product.unitMode === 'exact'
      ? `exact ${product.exactUnits}`
      : `range ${product.rangeUnits}`
    return `${product.asin} (${units})`
  }).join('\n')
}

function buildNotionProperties(application) {
  const submittedAt = new Date().toISOString()
  const titleSeed = application.website
    ? application.website.replace(/^https?:\/\//i, '').split('/')[0]
    : application.fullName
  const properties = {
    'Application Title': {
      title: [{ type: 'text', text: { content: `${titleSeed} — ${application.fullName}`.slice(0, 200) } }],
    },
    Channel: selectProp(application.channel),
    Status: selectProp('New'),
    'Full Name': richText(application.fullName),
    Title: richText(application.title),
    Email: { email: application.email },
    Website: { url: application.website },
    'Source Page': selectProp(application.sourcePage),
    'Submitted At': { date: { start: submittedAt } },
    'Raw Payload': richText(JSON.stringify(application)),
  }

  if (application.magnetSn) properties['Magnet SN'] = richText(application.magnetSn)

  if (application.channel === 'DTC') {
    properties['Retention Outcomes'] = multiSelectProp(application.retentionOutcomes)
    if (application.retentionOther) properties['Retention Other'] = richText(application.retentionOther)
    properties['Strategic Goals'] = multiSelectProp(mapOptions(application.strategicGoals, STRATEGIC_GOAL_MAP))
    properties['Monthly DTC Orders'] = selectProp(mapOption(application.monthlyOrders, MONTHLY_ORDER_MAP))
    properties.AOV = selectProp(mapOption(application.aov, AOV_MAP))
    properties['Fulfillment Model'] = selectProp(application.fulfillmentModel)
    if (application.fulfillmentOther) properties['Fulfillment Other'] = richText(application.fulfillmentOther)
    if (application.insertCapability) {
      properties['Insert Capability'] = selectProp(application.insertCapability)
    }
    properties['Business Model'] = selectProp(application.businessModel)
    if (application.businessOther) properties['Business Other'] = richText(application.businessOther)
    if (application.activeSubscribers) {
      properties['Active Subscribers'] = selectProp(mapOption(application.activeSubscribers, SUBSCRIBER_MAP))
    }
  } else {
    properties['Amazon Storefront'] = { url: application.amazonStorefront }
    properties['Business Goals'] = multiSelectProp(mapOptions(application.businessGoals, BUSINESS_GOAL_MAP))
    properties.Products = richText(formatProducts(application.products))
    properties['Other Sellers'] = selectProp(application.otherSellers)
    properties['Brand Registry'] = selectProp(application.brandRegistry)
    properties['Package Inserts'] = multiSelectProp(application.packageInserts)
    if (application.insertOther) properties['Insert Other'] = richText(application.insertOther)
    if (application.manufacturingLocation) {
      properties['Manufacturing Location'] = richText(application.manufacturingLocation)
    }
    properties['Amazon Fulfillment'] = multiSelectProp(application.amazonFulfillment)
  }

  return properties
}

async function createAboutPilotApplication(body) {
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
    channel: application.channel === 'Amazon' ? 'AMAZON' : 'DTC',
    email: application.email,
  }
}

module.exports = {
  createAboutPilotApplication,
  validateApplication,
  DEFAULT_DATABASE_ID,
}
