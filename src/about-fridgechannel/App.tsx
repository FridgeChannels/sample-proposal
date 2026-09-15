import { useEffect, useMemo, useRef } from 'react'
import { extractGiftChallengeConfig } from '../template/gift-challenge-template'
import giftChallengeDocument from './gift-challenge.html?raw'
import { IntakeForm } from './IntakeForm'
import { FloatingBackButton } from '../shared/FloatingBackButton'
import formCss from './styles.css?raw'

function homepageWithoutFooter(source: string) {
  const template = extractGiftChallengeConfig(source)
  const document = new DOMParser().parseFromString(`<body>${template.bodyMarkup}</body>`, 'text/html')
  document.querySelector('.footer-slide')?.remove()
  return {
    ...template,
    bodyMarkup: document.body.innerHTML,
  }
}

export function App() {
  const hostRef = useRef<HTMLDivElement>(null)
  const template = useMemo(() => homepageWithoutFooter(giftChallengeDocument), [])

  useEffect(() => {
    const fontLinks = template.fontLinks.map((href) => {
      const link = document.createElement('link')
      link.rel = href.includes('fonts.googleapis.com') ? 'stylesheet' : 'preconnect'
      link.href = href
      if (href.includes('fonts.gstatic.com')) link.crossOrigin = 'anonymous'
      link.dataset.proposalFont = 'true'
      document.head.appendChild(link)
      return link
    })

    const scriptTags = template.scripts.map((scriptSource) => {
      const script = document.createElement('script')
      script.text = `(() => {\n${scriptSource}\n})()`
      script.dataset.proposalBehavior = 'true'
      document.body.appendChild(script)
      return script
    })

    return () => {
      scriptTags.forEach((script) => script.remove())
      fontLinks.forEach((link) => link.remove())
    }
  }, [template])

  useEffect(() => {
    const video = hostRef.current?.querySelector<HTMLVideoElement>('.hero-video')
    if (!video) return

    const startPlayback = () => {
      video.muted = true
      video.defaultMuted = true
      void video.play().catch(() => {
        // Browsers may still defer autoplay in data-saving or low-power modes.
      })
    }

    const resumeWhenVisible = () => {
      if (document.visibilityState === 'visible') startPlayback()
    }

    video.addEventListener('loadeddata', startPlayback)
    video.addEventListener('canplay', startPlayback)
    document.addEventListener('visibilitychange', resumeWhenVisible)
    startPlayback()

    return () => {
      video.removeEventListener('loadeddata', startPlayback)
      video.removeEventListener('canplay', startPlayback)
      document.removeEventListener('visibilitychange', resumeWhenVisible)
    }
  }, [template])

  useEffect(() => {
    hostRef.current?.querySelectorAll('.reveal, .section-reveal, .hero-sequence, .blur-reveal').forEach((el) => {
      el.classList.add('visible', 'is-visible', 'in-view')
    })
  }, [template])

  return (
    <>
      <FloatingBackButton />
      <style data-proposal-style-config>{template.css}</style>
      <style data-intake-style>{formCss}</style>
      <style>{`
        .reveal,.section-reveal,.hero-sequence,.blur-word{opacity:1!important;filter:none!important;transform:none!important}
        main>section.fc-intake.footer-slide{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;scroll-snap-align:none!important;background:#fff!important;color:#201712!important}
      `}</style>
      <div ref={hostRef} dangerouslySetInnerHTML={{ __html: template.bodyMarkup }} />
      <section className="footer footer-slide demo-slide fc-intake" aria-labelledby="intake-title">
        <div className="wrap">
          <IntakeForm />
        </div>
      </section>
    </>
  )
}
