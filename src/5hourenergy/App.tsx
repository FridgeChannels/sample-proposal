import { useEffect, useMemo, useRef } from 'react'
import { extractPilotPlanConfig } from './pilot-plan-template'

declare global {
  interface Window {
    __PILOT_MEET__?: { sn: string; mode: 'meet' | 'prep' }
  }
}

function readMeetConfig() {
  const params = new URLSearchParams(window.location.search)
  const sn = (params.get('sn') || '').trim()
  const pathname = window.location.pathname
  const isMeetPath = pathname.includes('/pilot-plan/meet')
  const mode = isMeetPath || params.get('mode') === 'meet' ? 'meet' : 'default'

  if (mode === 'meet' && !sn) {
    window.location.replace('/pilot-plan/prep')
    return null
  }

  if (mode === 'meet' && sn) {
    window.__PILOT_MEET__ = { sn, mode: 'meet' }
    document.body.dataset.meetMode = 'true'
  }

  return { sn, mode }
}

export function PilotPlan() {
  const meetConfig = useMemo(() => readMeetConfig(), [])
  const hostRef = useRef<HTMLDivElement>(null)
  const template = useMemo(() => extractPilotPlanConfig(), [])

  useEffect(() => {
    if (meetConfig?.mode === 'meet' && meetConfig.sn) {
      window.__PILOT_MEET__ = { sn: meetConfig.sn, mode: 'meet' }
      document.body.dataset.meetMode = 'true'
    }
  }, [meetConfig])

  useEffect(() => {
    const fontLinks = template.fontLinks.map((href) => {
      const link = document.createElement('link')
      link.rel = href.includes('fonts.googleapis.com') ? 'stylesheet' : 'preconnect'
      link.href = href
      if (href.includes('fonts.gstatic.com')) link.crossOrigin = 'anonymous'
      link.dataset.pilotPlanFont = 'true'
      document.head.appendChild(link)
      return link
    })

    const scriptTags = template.scripts.map((scriptSource) => {
      const script = document.createElement('script')
      script.text = `(() => {\n${scriptSource}\n})()`
      script.dataset.pilotPlanBehavior = 'true'
      document.body.appendChild(script)
      return script
    })

    const restoreHashTarget = window.requestAnimationFrame(() => {
      const target = window.location.hash
        ? document.querySelector<HTMLElement>(window.location.hash)
        : null
      target?.scrollIntoView({ behavior: 'auto', block: 'start' })
    })

    return () => {
      scriptTags.forEach((script) => script.remove())
      fontLinks.forEach((link) => link.remove())
      window.cancelAnimationFrame(restoreHashTarget)
    }
  }, [template])

  useEffect(() => {
    const video = hostRef.current?.querySelector<HTMLVideoElement>('video[data-video]')
    if (!video) return

    const startPlayback = () => {
      video.muted = true
      video.defaultMuted = true
      void video.play().catch(() => {
        // Autoplay may still be blocked in data-saving / low-power modes.
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
      <style data-pilot-plan-styles>{template.css}</style>
      <div ref={hostRef} dangerouslySetInnerHTML={{ __html: template.bodyMarkup }} />
    </>
  )
}
