import { useEffect, useRef, useState } from 'react'
import { ChevronSmallLeftIcon } from './ChevronSmallLeftIcon'

const HOMMIO_SITES = {
  dtc: {
    title: 'Hommio for DTC brands',
    url: 'https://hommio.ai/dtcbrands',
    returnLabel: 'Customer View',
    fallbackPath: '/dtc-sample.html',
  },
  amazon: {
    title: 'Hommio for Amazon brands',
    url: 'https://hommio.ai/amazonbrands',
    returnLabel: 'Customer View',
    fallbackPath: '/asin-sample.html',
  },
} as const

const HOMMIO_HOME_URL = 'https://hommio.ai/'
const HOMMIO_FRAME_NAME = 'hommio-site'

type SiteKey = keyof typeof HOMMIO_SITES

function readSiteKey(): SiteKey {
  return new URLSearchParams(window.location.search).get('site') === 'amazon' ? 'amazon' : 'dtc'
}

function isAllowedReturnPath(pathname: string) {
  return /^\/(?:dtc-sample(?:\.html)?|asin-sample(?:\.html)?|(?:p|gift-proposal)\/[^/?#]+)\/?$/i.test(pathname)
}

function getReturnHref(site: SiteKey) {
  const fallbackPath = HOMMIO_SITES[site].fallbackPath
  const returnTo = new URLSearchParams(window.location.search).get('returnTo')
  if (!returnTo) return fallbackPath

  try {
    const candidate = new URL(returnTo, window.location.origin)
    if (candidate.origin !== window.location.origin || !isAllowedReturnPath(candidate.pathname)) {
      return fallbackPath
    }
    return `${candidate.pathname}${candidate.search}${candidate.hash}`
  } catch {
    return fallbackPath
  }
}

export function App() {
  const siteKey = readSiteKey()
  const site = HOMMIO_SITES[siteKey]
  const siteUrl = site.url
  const returnHref = getReturnHref(siteKey)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [barVisible, setBarVisible] = useState(true)

  useEffect(() => {
    function handleEmbeddedScroll(event: MessageEvent) {
      if (event.origin !== new URL(siteUrl).origin) return
      if (event.source !== frameRef.current?.contentWindow) return
      if (event.data?.channel !== 'hommio-embed' || event.data?.type !== 'scroll-direction') return

      if (event.data.direction === 'down') setBarVisible(false)
      if (event.data.direction === 'up') setBarVisible(true)
    }

    window.addEventListener('message', handleEmbeddedScroll)
    return () => window.removeEventListener('message', handleEmbeddedScroll)
  }, [siteUrl])

  return (
    <main className="hommio-frame">
      <header className={`hommio-frame__bar${barVisible ? '' : ' is-hidden'}`} aria-hidden={!barVisible}>
        <a className="hommio-frame__back" href={returnHref}>
          <ChevronSmallLeftIcon aria-hidden="true" focusable="false" size={18} />
          <span>{site.returnLabel}</span>
        </a>
        <a
          className="hommio-frame__identity hommio-frame__home"
          href={HOMMIO_HOME_URL}
          target={HOMMIO_FRAME_NAME}
          aria-label="Hommio 首页"
        >
          <span className="hommio-frame__brand">hommio</span>
        </a>
      </header>
      <iframe
        ref={frameRef}
        name={HOMMIO_FRAME_NAME}
        className="hommio-frame__site"
        src={siteUrl}
        title={site.title}
        allow="fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </main>
  )
}
