import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import './3d-folder.css'

export interface FolderProject {
  id: string
  number: string
  shortTitle: string
  title: string
  paragraphs: string[]
  emphasisLast?: boolean
  icon: 'strategy' | 'magnet' | 'insights'
  logo: string
}

interface AnimatedFolderProps {
  title: string
  projects: FolderProject[]
  className?: string
}

export function AnimatedFolder({ title, projects, className }: AnimatedFolderProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const cardButtons = useRef<(HTMLButtonElement | null)[]>([])
  const lastOpenedIndex = useRef<number | null>(null)

  const close = () => {
    setIsVisible(false)
    window.setTimeout(() => {
      setSelectedIndex(null)
      if (lastOpenedIndex.current !== null) cardButtons.current[lastOpenedIndex.current]?.focus()
    }, 260)
  }

  const open = (index: number) => {
    lastOpenedIndex.current = index
    setSelectedIndex(index)
    window.requestAnimationFrame(() => setIsVisible(true))
  }

  useEffect(() => {
    if (selectedIndex === null) return

    const oldOverflow = document.body.style.overflow
    const oldSnap = document.documentElement.style.scrollSnapType
    document.body.style.overflow = 'hidden'
    document.documentElement.style.scrollSnapType = 'none'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowRight') setSelectedIndex((index) => Math.min(projects.length - 1, (index ?? 0) + 1))
      if (event.key === 'ArrowLeft') setSelectedIndex((index) => Math.max(0, (index ?? 0) - 1))
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = oldOverflow
      document.documentElement.style.scrollSnapType = oldSnap
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [selectedIndex, projects.length])

  const currentProject = selectedIndex === null ? null : projects[selectedIndex]

  return (
    <>
      <div
        className={cn('animated-folder', isExpanded && 'is-expanded', className)}
        onPointerEnter={(event) => {
          if (event.pointerType !== 'touch') setIsExpanded(true)
        }}
        onFocusCapture={() => {
          if (window.matchMedia('(hover: hover)').matches) setIsExpanded(true)
        }}
      >
        <div className="animated-folder__glow" aria-hidden="true" />
        <div className="animated-folder__stage">
          <div className="animated-folder__back" aria-hidden="true" />
          <div className="animated-folder__tab" aria-hidden="true" />
          <div className="animated-folder__previews">
            {projects.slice(0, 3).map((project, index) => {
              return (
                <button
                  key={project.id}
                  ref={(element) => { cardButtons.current[index] = element }}
                  type="button"
                  className="animated-folder__preview"
                  style={{ '--card-index': index } as React.CSSProperties}
                  onClick={() => open(index)}
                  tabIndex={isExpanded ? 0 : -1}
                  aria-label={`Open ${project.title}`}
                >
                  <span className="animated-folder__preview-number">{project.number}</span>
                  <img className="animated-folder__preview-logo" src={project.logo} alt="" aria-hidden="true" />
                  <span className="animated-folder__preview-title">{project.shortTitle}</span>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            className="animated-folder__front"
            aria-expanded={isExpanded}
            aria-label="Explore Hommio Solution folder"
            onClick={() => setIsExpanded(true)}
          >
            <span className="animated-folder__front-title">Hommio Solution</span>
          </button>
          <div className="animated-folder__shine" aria-hidden="true" />
        </div>
        <div className="animated-folder__caption">
          <span>{title}</span>
        </div>
        <span className="animated-folder__hint">{isExpanded ? 'Select a part to read' : 'Hover or tap to explore'}</span>
      </div>

      {currentProject && createPortal(
        <div
          className={cn('folder-lightbox', isVisible && 'is-visible')}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget || (event.target instanceof Element && event.target.classList.contains('folder-lightbox__backdrop'))) close()
          }}
        >
          <div className="folder-lightbox__backdrop" aria-hidden="true" />
          <div className="folder-lightbox__dialog" role="dialog" aria-modal="true" aria-labelledby="folder-lightbox-title">
            <div className="folder-lightbox__toolbar">
              <span>One retention solution · {currentProject.number} / 03</span>
              <button type="button" className="folder-lightbox__close" onClick={close} aria-label="Close details"><X size={20} /></button>
            </div>
            <div className="folder-lightbox__body">
              <div className="folder-lightbox__visual" aria-hidden="true"><img src={currentProject.logo} alt="" /><span>{currentProject.number}</span></div>
              <div className="folder-lightbox__copy">
                <p className="folder-lightbox__eyebrow">Part {currentProject.number}</p>
                <h3 id="folder-lightbox-title">{currentProject.title}</h3>
                {currentProject.paragraphs.map((paragraph, index) => (
                  <p key={paragraph} className={currentProject.emphasisLast && index === currentProject.paragraphs.length - 1 ? 'folder-lightbox__emphasis' : undefined}>{paragraph}</p>
                ))}
              </div>
            </div>
            <div className="folder-lightbox__footer">
              <div className="folder-lightbox__steps" aria-label="Choose a part">
                {projects.map((project, index) => (
                  <button key={project.id} type="button" className={index === selectedIndex ? 'is-active' : ''} onClick={() => setSelectedIndex(index)} aria-label={`View part ${project.number}`} aria-current={index === selectedIndex ? 'step' : undefined} />
                ))}
              </div>
              <div className="folder-lightbox__navigation">
                <button type="button" onClick={() => setSelectedIndex((index) => Math.max(0, (index ?? 0) - 1))} disabled={selectedIndex === 0} aria-label="Previous part"><ChevronLeft size={22} /></button>
                <button type="button" onClick={() => setSelectedIndex((index) => Math.min(projects.length - 1, (index ?? 0) + 1))} disabled={selectedIndex === projects.length - 1} aria-label="Next part"><ChevronRight size={22} /></button>
              </div>
            </div>
          </div>
        </div>, document.body)}
    </>
  )
}
