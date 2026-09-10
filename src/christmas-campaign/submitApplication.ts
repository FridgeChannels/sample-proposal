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
  }

  if (channel === 'ASIN') {
    payload.asinUrl = String(data.get('asinUrl') || '').trim()
  }

  return payload
}

export async function submitChristmasCampaignApplication(
  payload: ChristmasCampaignApplicationPayload,
): Promise<{ pageId?: string; url?: string | null }> {
  const response = await fetch('/api/christmas-campaign/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const result = (await response.json().catch(() => ({}))) as {
    error?: string
    pageId?: string
    url?: string | null
  }

  if (!response.ok) {
    throw new Error(result.error || 'Unable to save your application. Please try again.')
  }

  return result
}
