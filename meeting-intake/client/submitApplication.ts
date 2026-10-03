export type AboutPilotChannel = 'DTC' | 'Amazon'

export type AboutPilotDtcPayload = {
  channel: 'DTC'
  fullName: string
  title: string
  email: string
  website: string
  magnetSn?: string
  retentionOutcomes: string[]
  retentionOther?: string
  strategicGoals: string[]
  monthlyOrders: string
  aov: string
  fulfillmentModel: string
  fulfillmentOther?: string
  insertCapability?: string
  businessModel: string
  businessOther?: string
  activeSubscribers?: string
  formToken: string
}

export type AboutPilotAmazonProduct = {
  asin: string
  unitMode: 'exact' | 'range'
  exactUnits?: string
  rangeUnits?: string
}

export type AboutPilotAmazonPayload = {
  channel: 'Amazon'
  fullName: string
  title: string
  email: string
  website: string
  magnetSn?: string
  amazonStorefront: string
  businessGoals: string[]
  products: AboutPilotAmazonProduct[]
  otherSellers: string
  brandRegistry: string
  packageInserts: string[]
  insertOther?: string
  manufacturingLocation?: string
  amazonFulfillment: string[]
  formToken: string
}

export type AboutPilotPayload = AboutPilotDtcPayload | AboutPilotAmazonPayload

export type MeetingIntakeApi = {
  formToken?: string
  submit?: string
}

const DEFAULT_FORM_TOKEN_ENDPOINT = '/api/about-pilot/form-token'
const DEFAULT_SUBMIT_ENDPOINT = '/api/about-pilot/apply'

export async function fetchAboutPilotFormToken(endpoint = DEFAULT_FORM_TOKEN_ENDPOINT): Promise<string> {
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  const result = (await response.json().catch(() => ({}))) as { token?: string; error?: string }
  if (!response.ok || !result.token) {
    throw new Error(result.error || 'Unable to prepare the form. Please refresh and try again.')
  }
  return result.token
}

const NOTION_PAGE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isNotionPageId(value: unknown): value is string {
  return typeof value === 'string' && NOTION_PAGE_ID_RE.test(value)
}

const SAVE_FAILED_MESSAGE =
  "We couldn't save your application. Please try again — booking opens only after it is saved successfully."

export async function submitAboutPilotApplication(
  payload: AboutPilotPayload,
  endpoint = DEFAULT_SUBMIT_ENDPOINT,
): Promise<{ pageId: string; url: string | null }> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const result = (await response.json().catch(() => ({}))) as {
    ok?: boolean
    error?: string
    pageId?: string
    url?: string | null
    alreadyApplied?: boolean
  }

  if (!response.ok) {
    throw new Error(result.error || SAVE_FAILED_MESSAGE)
  }
  if (result.alreadyApplied) {
    throw new Error(
      result.error
      || 'This work email already submitted an application. Please wait for our follow-up, or use a different work email.',
    )
  }
  if (!result.ok || !isNotionPageId(result.pageId)) {
    throw new Error(SAVE_FAILED_MESSAGE)
  }
  return { pageId: result.pageId, url: result.url ?? null }
}

/** Build a Calendly URL with the submitted contact prefilled. */
export function buildCalendlyPrefillUrl(
  baseUrl: string,
  invitee: { fullName: string; email: string },
): string {
  const url = new URL(baseUrl)
  const parts = String(invitee.fullName || '').trim().split(/\s+/).filter(Boolean)
  if (parts[0]) url.searchParams.set('first_name', parts[0])
  if (parts.length > 1) url.searchParams.set('last_name', parts.slice(1).join(' '))
  if (invitee.email) url.searchParams.set('email', invitee.email)
  return url.toString()
}

export function snFromSearchParams(search = window.location.search): string | undefined {
  const params = new URLSearchParams(search)
  return params.get('sn') || params.get('id') || undefined
}
