import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatedFolder, type FolderProject } from '../components/ui/3d-folder'
import { TiltedGridHero } from '../components/ui/tilted-grid-hero'
import { extractPilotPlanConfig } from './pilot-plan-template'

const heroImages = [
  { src: '/gourmendfoods/products/hero-taco-seasoning.webp', alt: 'Gourmend Taco Seasoning' },
  { src: '/gourmendfoods/products/hero-chicken-bone-broth-powder.webp', alt: 'Gourmend Chicken Bone Broth Powder' },
  { src: '/gourmendfoods/products/hero-garlic-scape-powder.webp', alt: 'Gourmend Garlic Scape Powder' },
  { src: '/gourmendfoods/products/hero-fridge-kitchen-scene.png', alt: 'Customer reaching into a refrigerator', aspectRatio: 4 / 3 },
  { src: '/gourmendfoods/products/hero-fridge-portrait-scene.png', alt: 'Customer seeing a Hommio fridge magnet', aspectRatio: 1672 / 941 },
  {
    src: '/gourmendfoods/products/hero-fridge-magnet.mp4',
    poster: '/gourmendfoods/products/hero-fridge-magnet-poster.jpg',
    type: 'video' as const,
    alt: 'Rotating fridge magnet product demonstration',
    aspectRatio: 9 / 16,
  },
  { src: '/gourmendfoods/products/hero-fridge-coffee-scene.png', alt: 'Coffee brand magnet on a refrigerator', aspectRatio: 1696 / 927 },
]

const solutionParts: FolderProject[] = [
  {
    id: 'strategy', number: '01', shortTitle: 'Strategic deployment', icon: 'strategy', logo: '/gourmendfoods/products/icon-strategy-target.png',
    title: 'Strategic deployment built around your brand.',
    paragraphs: [
      'Your business model, sales channels, and customers’ buying habits shape the plan: who receives Hommio, when, how often, and with which design and experience.',
      'Make each deployment serve your retention goals—not just reach more homes.',
    ],
    emphasisLast: true,
  },
  {
    id: 'reorder', number: '02', shortTitle: 'Reorder Magnet', icon: 'magnet', logo: '/gourmendfoods/products/icon-reorder-magnet.png',
    title: 'A Reorder Magnet for the home.',
    paragraphs: [
      'A physical reminder of your brand, with a simple way to act on it. Customers keep it on their fridge or another everyday surface and tap it to reach your products or content.',
      'When they are ready to buy, Hommio can take them back to your DTC store or Amazon Brand Store without starting with a search.',
    ],
  },
  {
    id: 'insights', number: '03', shortTitle: 'Retention intelligence', icon: 'insights', logo: '/gourmendfoods/products/icon-retention-growth.png',
    title: 'In-home retention intelligence that grows with each tap.',
    paragraphs: [
      'Each tap helps your brand better understand what customers need at home. With customer permission and available data, Hommio builds on their preferences, responses, and reorder habits to strengthen your brand’s in-home retention intelligence.',
      'That understanding helps your brand make each visit more relevant—with tailored coupons, short surveys, useful content, and personalized reorder options. Each interaction helps inform what to offer next, without replacing the magnet.',
    ],
  },
]

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
  const [folderHost, setFolderHost] = useState<HTMLElement | null>(null)
  const [heroHost, setHeroHost] = useState<HTMLElement | null>(null)
  const template = useMemo(() => extractPilotPlanConfig(), [])
  const bodyMarkup = useMemo(() => ({ __html: template.bodyMarkup }), [template])

  useLayoutEffect(() => {
    const deck = hostRef.current?.querySelector<HTMLElement>('.hommio-deck')
    if (!deck || !('IntersectionObserver' in window)) return

    const pages = deck.querySelectorAll<HTMLElement>(':scope > section')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('page-in-view', entry.isIntersecting)
      })
    }, { rootMargin: '-10% 0px -10% 0px', threshold: 0 })

    deck.classList.add('page-motion-ready')
    pages.forEach((page) => observer.observe(page))

    return () => {
      observer.disconnect()
      deck.classList.remove('page-motion-ready')
      pages.forEach((page) => page.classList.remove('page-in-view'))
    }
  }, [template])

  useEffect(() => {
    setFolderHost(hostRef.current?.querySelector<HTMLElement>('[data-parts-folder-root]') ?? null)
    setHeroHost(hostRef.current?.querySelector<HTMLElement>('[data-tilted-grid-hero]') ?? null)
  }, [template])

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
      <div ref={hostRef} dangerouslySetInnerHTML={bodyMarkup} />
      {folderHost && createPortal(<AnimatedFolder title="Explore the three parts" projects={solutionParts} />, folderHost)}
      {heroHost && createPortal(<TiltedGridHero images={heroImages} aspectRatio={1} gap={0} />, heroHost)}
    </>
  )
}
