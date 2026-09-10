export type ChristmasCampaignChannel = 'ASIN' | 'DTC'

export type ChristmasCampaignApplicationPayload = {
  channel: ChristmasCampaignChannel
  fullName: string
  title: string
  phone: string
  email: string
  brand: string
  website: string
  asinUrl?: string
  productTypes: string[]
  campaignGoals: string[]
  distribution: string
  delivery: string
  budget: string
  formToken: string
  company_website?: string
}

function collectMulti(form: FormData, name: string): string[] {
  return form
    .getAll(name)
    .map((value) => String(value || '').trim())
    .filter(Boolean)
}

export function buildChristmasCampaignPayload(
  form: HTMLFormElement,
  channel: ChristmasCampaignChannel,
  selections: { productTypes: string[]; campaignGoals: string[] },
  formToken: string,
): ChristmasCampaignApplicationPayload {
  const data = new FormData(form)
  const payload: ChristmasCampaignApplicationPayload = {
    channel,
    fullName: String(data.get('fullName') || '').trim(),
    title: String(data.get('title') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    email: String(data.get('email') || '').trim(),
    brand: String(data.get('brand') || '').trim(),
    website: String(data.get('website') || '').trim(),
    productTypes: selections.productTypes.length
      ? selections.productTypes
      : collectMulti(data, 'productType'),
    campaignGoals: selections.campaignGoals.length
      ? selections.campaignGoals
      : collectMulti(data, 'campaignGoal'),
    distribution: String(data.get('distribution') || '').trim(),
    delivery: String(data.get('delivery') || '').trim(),
    budget: String(data.get('budget') || '').trim(),
    formToken,
    company_website: String(data.get('company_website') || ''),
  }

  if (channel === 'ASIN') {
    payload.asinUrl = String(data.get('asinUrl') || '').trim()
  }

  return payload
}

export async function fetchChristmasCampaignFormToken(): Promise<string> {
  const response = await fetch('/api/christmas-campaign/form-token', {
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

/**
 * Submits the campaign application. Resolves only when Notion created a new page.
 * Never treat soft/partial responses as success — callers must not open Calendly otherwise.
 */
export async function submitChristmasCampaignApplication(
  payload: ChristmasCampaignApplicationPayload,
): Promise<{ pageId: string; url: string | null }> {
  const response = await fetch('/api/christmas-campaign/apply', {
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
    honeypot?: boolean
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

  if (result.honeypot || !result.ok || !isNotionPageId(result.pageId)) {
    throw new Error(SAVE_FAILED_MESSAGE)
  }

  return { pageId: result.pageId, url: result.url ?? null }
}

/** Split "Full Name" into Calendly first_name / last_name. */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

/** Prefill Calendly invitee fields after a successful application submit. */
export function buildCalendlyPrefillUrl(
  baseUrl: string,
  invitee: { fullName: string; email: string },
): string {
  const url = new URL(baseUrl)
  const { firstName, lastName } = splitFullName(invitee.fullName)
  if (firstName) url.searchParams.set('first_name', firstName)
  if (lastName) url.searchParams.set('last_name', lastName)
  if (invitee.email) url.searchParams.set('email', invitee.email)
  return url.toString()
}
