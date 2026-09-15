export type MagnetExperience = 'dtc' | 'asin_plus'

export type SamplePhaseResponse = {
  phase?: 'sample' | 'live'
  status?: number | null
  experience?: MagnetExperience | string | null
  magnetSn?: string
  reason?: string
}

export function normalizeMagnetExperience(value: unknown): MagnetExperience {
  return String(value || '').trim().toLowerCase() === 'asin_plus' ? 'asin_plus' : 'dtc'
}

export function aboutPageForExperience(experience: MagnetExperience): string {
  return experience === 'asin_plus' ? '/fc-asin-plus-sample.html' : '/about-fridgechannel.html'
}

export function aboutPageUrlForSn(experience: MagnetExperience, sn: string | null): string {
  const page = aboutPageForExperience(experience)
  if (!sn) return page
  const params = new URLSearchParams(window.location.search)
  params.set('sn', sn)
  params.delete('id')
  const query = params.toString()
  return `${page}${query ? `?${query}` : ''}`
}

export async function fetchMagnetExperience(sn: string | null): Promise<MagnetExperience> {
  if (!sn) return 'dtc'
  try {
    const response = await fetch(`/api/sample-phase?sn=${encodeURIComponent(sn)}`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return 'dtc'
    const data = (await response.json()) as SamplePhaseResponse
    return normalizeMagnetExperience(data.experience)
  } catch {
    return 'dtc'
  }
}
