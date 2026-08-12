/** Magnet SN from `/p/{sn}` or `?sn=` / `?id=`. */
export function snFromLocation(
  location: Pick<Location, 'pathname' | 'search'> = window.location,
): string | null {
  const pathMatch = /^\/(?:gift-proposal|p)\/([^/?#]+)\/?$/.exec(location.pathname)
  if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1])
  const params = new URLSearchParams(location.search)
  return params.get('sn') || params.get('id') || null
}
