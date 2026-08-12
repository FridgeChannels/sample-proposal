import { useEffect, useMemo, useRef } from 'react'
import { createFitMeetingSampleConfig } from './fit-meeting-sample-template'
import './styles.css'

export const FitMeetingSample: React.FC = () => {
  const hostRef = useRef<HTMLDivElement>(null)
  const template = useMemo(() => createFitMeetingSampleConfig(), [])

  useEffect(() => {
    const fontLinks = template.fontLinks.map((href) => {
      const link = document.createElement('link')
      link.rel = href.includes('fonts.googleapis.com') ? 'stylesheet' : 'preconnect'
      link.href = href
      if (href.includes('fonts.gstatic.com')) link.crossOrigin = 'anonymous'
      link.dataset.fitMeetingSampleFont = 'true'
      document.head.appendChild(link)
      return link
    })

    const scriptTags = template.scripts.map((scriptSource) => {
      const script = document.createElement('script')
      script.text = `(() => {\n${scriptSource}\n})()`
      script.dataset.fitMeetingSampleBehavior = 'true'
      document.body.appendChild(script)
      return script
    })

    const restoreHashTarget = window.requestAnimationFrame(() => {
      const target = window.location.hash ? document.querySelector<HTMLElement>(window.location.hash) : null
      target?.scrollIntoView({ behavior: 'auto', block: 'start' })
    })

    return () => {
      scriptTags.forEach((script) => script.remove())
      fontLinks.forEach((link) => link.remove())
      window.cancelAnimationFrame(restoreHashTarget)
    }
  }, [template])

  return (
    <>
      <style data-fit-meeting-sample-shared-styles>{template.css}</style>
      <div ref={hostRef} dangerouslySetInnerHTML={{ __html: template.bodyMarkup }} />
    </>
  )
}
