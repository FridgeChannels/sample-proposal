import { snFromLocation } from '../config'

function aboutPageSrc() {
  const path = window.location.pathname
  if (path.includes('asin-sample')) return '/fc-asin-plus-sample.html'
  return '/about-fridgechannel.html'
}

export function AboutFridgeChannelView({ active }: { active: boolean }) {
  const sn = snFromLocation()
  const params = new URLSearchParams(window.location.search)
  if (sn && !params.get('sn') && !params.get('id')) params.set('sn', sn)
  const query = params.toString()
  const pageSrc = aboutPageSrc()
  const src = `${pageSrc}${query ? `?${query}` : ''}`
  const isAsinAbout = pageSrc.includes('fc-asin-plus-sample')

  return (
    <main className={`about-fridgechannel-view${isAsinAbout ? ' is-asin-about' : ''}${active ? '' : ' is-preserved-hidden'}`} aria-hidden={!active}>
      <iframe
        src={src}
        title={isAsinAbout ? 'FC ASIN+' : 'About FridgeChannel'}
        loading="eager"
        allow="clipboard-read; clipboard-write; fullscreen"
        allowFullScreen
      />
    </main>
  )
}
