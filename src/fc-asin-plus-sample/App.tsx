import { useEffect, useMemo, useRef } from 'react'
import { AsinApplyForm } from './AsinApplyForm'
import { createFcAsinPlusSampleConfig } from './fc-asin-plus-sample-template'
import { fcAsinPlusSampleContent } from './mock-data'
import applyCss from './asin-apply.css?inline'

export const FcAsinPlusSample: React.FC = () => {
  const hostRef = useRef<HTMLElement>(null)
  const template = useMemo(() => createFcAsinPlusSampleConfig(), [])

  useEffect(() => {
    document.title = fcAsinPlusSampleContent.pageTitle

    const fontLinks = template.fontLinks.map((href) => {
      const link = document.createElement('link')
      link.rel = href.includes('fonts.googleapis.com') ? 'stylesheet' : 'preconnect'
      link.href = href
      if (href.includes('fonts.gstatic.com')) link.crossOrigin = 'anonymous'
      link.dataset.fcAsinPlusSampleFont = 'true'
      document.head.appendChild(link)
      return link
    })

    const scriptTags = template.scripts.map((scriptSource) => {
      const script = document.createElement('script')
      script.text = `(() => {\n${scriptSource}\n})()`
      script.dataset.fcAsinPlusSampleBehavior = 'true'
      document.body.appendChild(script)
      return script
    })

    return () => {
      scriptTags.forEach((script) => script.remove())
      fontLinks.forEach((link) => link.remove())
    }
  }, [template])

  useEffect(() => {
    const page = hostRef.current
    if (!page) return
    const slides = [...page.querySelectorAll<HTMLElement>('.asin-slide')]
    const progress = page.querySelector<HTMLElement>('.asin-progress i')
    if (!page || !slides.length) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobile = window.matchMedia('(max-width: 760px)')
    const setActive = (index: number) => {
      slides.forEach((slide, slideIndex) => {
        const on = slideIndex === index
        slide.classList.toggle('is-active', on)
        slide.classList.toggle('is-in-view', on)
        if (on) slide.classList.add('is-seen')
      })
      page.style.setProperty('--asin-progress', `${(index + 1) / slides.length}`)
      if (progress) progress.style.transform = `scaleX(${(index + 1) / slides.length})`
    }

    page.classList.add('asin-ready')

    if (reduced.matches) {
      slides.forEach((slide) => slide.classList.add('is-active', 'is-in-view', 'is-seen'))
      setActive(0)
      return
    }

    const activateVisible = () => {
      const viewport = mobile.matches ? page.getBoundingClientRect() : { top: 0, height: window.innerHeight }
      const marker = viewport.top + viewport.height * 0.42
      let next = 0
      slides.forEach((slide, index) => {
        const rect = slide.getBoundingClientRect()
        if (rect.top <= marker) next = index
      })
      setActive(next)
    }

    setActive(0)
    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver(() => activateVisible(), {
          root: mobile.matches ? page : null,
          threshold: [0.28, 0.5, 0.72],
        })
      : null
    slides.forEach((slide) => observer?.observe(slide))
    const scrollTarget = mobile.matches ? page : window
    scrollTarget.addEventListener('scroll', activateVisible, { passive: true })
    activateVisible()
    return () => {
      observer?.disconnect()
      scrollTarget.removeEventListener('scroll', activateVisible)
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

  return (
    <>
      <style data-fc-asin-plus-sample-styles>{template.css}</style>
      <style data-fc-asin-apply-styles>{applyCss}</style>
      <main className="asin-page" ref={hostRef}>
        <div className="asin-slides" dangerouslySetInnerHTML={{ __html: template.bodyMarkup }} />
        <AsinApplyForm />
      </main>
    </>
  )
}
