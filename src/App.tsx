import { useEffect, useMemo, useRef } from 'react'
import { extractGiftChallengeConfig } from './template/gift-challenge-template'

export function App() {
  const hostRef = useRef<HTMLDivElement>(null)
  const template = useMemo(() => extractGiftChallengeConfig(), [])

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
      script.text = scriptSource
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

  return (
    <>
      <style data-proposal-style-config>{template.css}</style>
      <div ref={hostRef} dangerouslySetInnerHTML={{ __html: template.bodyMarkup }} />
    </>
  )
}
