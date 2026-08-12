import { useEffect, useMemo } from 'react'
import { extractGiftChallengeConfig } from '../template/gift-challenge-template'
import { qualifiedMeetingContent } from './mock-data'
import {
  DecisionSlide,
  DefinitionSlide,
  FitQuestionsSlide,
  OutcomesSlide,
  PurposeSlide,
  SampleSlide,
  ValueSlide,
} from './components/FitMeetingSlides'
import './styles.css'

const slideLabels = ['Purpose', 'What FC Is', 'Value', 'Outcomes', 'Fit', 'Sample', 'Decision']

export const QualifiedMeetingDoc: React.FC = () => {
  const sampleStyles = useMemo(() => extractGiftChallengeConfig(), [])

  useEffect(() => {
    document.body.classList.add('qualified-meeting-body')

    const fontLinks = sampleStyles.fontLinks.map((href) => {
      const link = document.createElement('link')
      link.rel = href.includes('fonts.googleapis.com') ? 'stylesheet' : 'preconnect'
      link.href = href
      if (href.includes('fonts.gstatic.com')) link.crossOrigin = 'anonymous'
      link.dataset.qualifiedMeetingFont = 'true'
      document.head.appendChild(link)
      return link
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!['ArrowDown', 'ArrowRight', 'PageDown', 'ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key)) return
      const slides = [...document.querySelectorAll<HTMLElement>('.fit-slide')]
      const currentIndex = slides.reduce((closest, slide, index) => {
        const currentDistance = Math.abs(slide.getBoundingClientRect().top)
        const closestDistance = Math.abs(slides[closest].getBoundingClientRect().top)
        return currentDistance < closestDistance ? index : closest
      }, 0)
      const direction = ['ArrowDown', 'ArrowRight', 'PageDown'].includes(event.key) ? 1 : -1
      const target = slides[Math.max(0, Math.min(slides.length - 1, currentIndex + direction))]
      if (!target || target === slides[currentIndex]) return
      event.preventDefault()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    window.addEventListener('keydown', handleKeyDown)

    const restoreHashTarget = window.requestAnimationFrame(() => {
      const target = window.location.hash ? document.querySelector<HTMLElement>(window.location.hash) : null
      target?.scrollIntoView({ behavior: 'auto', block: 'start' })
    })

    return () => {
      document.body.classList.remove('qualified-meeting-body')
      fontLinks.forEach((link) => link.remove())
      window.removeEventListener('keydown', handleKeyDown)
      window.cancelAnimationFrame(restoreHashTarget)
    }
  }, [sampleStyles])

  return (
    <>
      <style data-sample-shared-styles>{sampleStyles.css}</style>
      <a className="fit-skip-link" href="#slide-1">
        Skip to presentation
      </a>
      <nav className="fit-nav" aria-label="Presentation pages">
        <a className="fit-nav__brand" href="#slide-1" aria-label="FridgeChannels Fit Meeting home">
          FC
        </a>
        <div>
          {slideLabels.map((label, index) => (
            <a key={label} href={`#slide-${index + 1}`} aria-label={`Go to page ${index + 1}: ${label}`}>
              <span>{index + 1}</span>
              <em>{label}</em>
            </a>
          ))}
        </div>
      </nav>
      <main className="fit-deck">
        <PurposeSlide content={qualifiedMeetingContent.purpose} meeting={qualifiedMeetingContent.meeting} />
        <DefinitionSlide content={qualifiedMeetingContent.definition} />
        <ValueSlide content={qualifiedMeetingContent.values} />
        <OutcomesSlide content={qualifiedMeetingContent.outcomes} />
        <FitQuestionsSlide content={qualifiedMeetingContent.fit} />
        <SampleSlide content={qualifiedMeetingContent.sample} />
        <DecisionSlide content={qualifiedMeetingContent.decision} />
      </main>
    </>
  )
}
