import { captureEvent } from '../analytics'
import { snFromLocation, type InvestorChannel } from './experienceRoute'

const SLIDE_DWELL_MIN_MS = 1000
const SCROLL_DEPTH_MILESTONES = [25, 50, 75, 100]
const VIDEO_PROGRESS_MILESTONES = [25, 50, 75, 100]
const MAX_LABEL_LENGTH = 80

function createVisitId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const visitId = createVisitId()
const visitStartedAt = performance.now()

type VideoStats = {
  playCount: number
  playedMs: number
  watchedSeconds: number
  maxPositionSeconds: number
  durationSeconds: number
  completed: boolean
}

const session = {
  slideDwellMs: {} as Record<string, number>,
  slidesSeen: new Set<string>(),
  furthestSlideIndex: -1,
  maxScrollDepth: 0,
  clickCount: 0,
  experiences: [] as Array<{ channel: InvestorChannel; dwell_ms: number }>,
  videos: {} as Record<string, VideoStats>,
  storyPaused: false,
  summarized: false,
}

export function investorVisitId() {
  return visitId
}

export function trackInvestor(event: string, properties: Record<string, unknown> = {}, beacon = false) {
  captureEvent(
    `investor_${event}`,
    { magnet_sn: snFromLocation(), investor_visit_id: visitId, ...properties },
    beacon ? { transport: 'sendBeacon' } : undefined,
  )
}

function textLabel(el: Element): string {
  const raw = el.getAttribute('aria-label') || (el as HTMLElement).innerText || el.textContent || ''
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_LABEL_LENGTH)
}

type SlideMeta = { slide_id: string; slide_index: number; section: string; slide_title: string }

function slideMeta(slide: Element, slides: Element[]): SlideMeta {
  const index = slides.indexOf(slide)
  const section = slide.closest('section')?.getAttribute('aria-label') || 'unknown'
  const sectionSlides = slides.filter((item) => item.closest('section') === slide.closest('section'))
  const title = slide.querySelector('.story-section-title, h2, h1')
  return {
    slide_id: slide.id || `${section}#${sectionSlides.indexOf(slide) + 1}`,
    slide_index: index,
    section,
    slide_title: title ? textLabel(title) : '',
  }
}

function storySlides(): Element[] {
  return [...document.querySelectorAll('.story-page .story-screen')]
}

/** Slide the reader is currently on (the one covering the viewport center). */
export function currentSlide(): (SlideMeta & { element: Element }) | null {
  const slides = storySlides()
  const middle = window.innerHeight / 2
  const element = slides.find((slide) => {
    const rect = slide.getBoundingClientRect()
    return rect.top <= middle && rect.bottom > middle
  })
  return element ? { ...slideMeta(element, slides), element } : null
}

function slideContext(target: Element): Partial<SlideMeta> {
  const slide = target.closest('.story-screen')
  return slide ? slideMeta(slide, storySlides()) : {}
}

export function recordExperience(channel: InvestorChannel, dwellMs: number) {
  session.experiences.push({ channel, dwell_ms: dwellMs })
}

/**
 * While an experience view covers the story, slide timers stop so story dwell
 * only counts time the deck itself was on screen.
 */
let pauseSlides: (() => void) | null = null
let resumeSlides: (() => void) | null = null

export function setStoryPaused(paused: boolean) {
  if (session.storyPaused === paused) return
  session.storyPaused = paused
  if (paused) pauseSlides?.()
  else resumeSlides?.()
}

function startSlideTracking(): () => void {
  const slides = storySlides()
  const visible = new Map<Element, number>()
  const active = new Map<Element, number>()

  const close = (slide: Element, now: number) => {
    const start = active.get(slide)
    if (start == null) return
    active.delete(slide)
    const ms = Math.round(now - start)
    const meta = slideMeta(slide, slides)
    session.slideDwellMs[meta.slide_id] = (session.slideDwellMs[meta.slide_id] || 0) + ms
    if (ms >= SLIDE_DWELL_MIN_MS) trackInvestor('slide_dwell', { ...meta, dwell_ms: ms })
  }

  const open = (slide: Element, now: number) => {
    if (active.has(slide) || session.storyPaused || document.visibilityState === 'hidden') return
    active.set(slide, now)
    const meta = slideMeta(slide, slides)
    if (!session.slidesSeen.has(meta.slide_id)) {
      session.slidesSeen.add(meta.slide_id)
      trackInvestor('slide_view', { ...meta, seconds_since_open: Math.round((now - visitStartedAt) / 1000) })
    }
    session.furthestSlideIndex = Math.max(session.furthestSlideIndex, meta.slide_index)
  }

  const observer = new IntersectionObserver((entries) => {
    const now = performance.now()
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        visible.set(entry.target, now)
        open(entry.target, now)
      } else {
        visible.delete(entry.target)
        close(entry.target, now)
      }
    })
  }, { threshold: [0, 0.6] })
  slides.forEach((slide) => observer.observe(slide))

  const pauseAll = () => {
    const now = performance.now()
    ;[...active.keys()].forEach((slide) => close(slide, now))
  }
  const resumeAll = () => {
    const now = performance.now()
    visible.forEach((_, slide) => open(slide, now))
  }
  pauseSlides = pauseAll
  resumeSlides = resumeAll

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') pauseAll()
    else resumeAll()
  }
  document.addEventListener('visibilitychange', onVisibility)

  return () => {
    pauseAll()
    observer.disconnect()
    document.removeEventListener('visibilitychange', onVisibility)
    pauseSlides = null
    resumeSlides = null
  }
}

function startScrollDepthTracking(): () => void {
  const reached = new Set<number>()
  const onScroll = () => {
    if (session.storyPaused) return
    const scrollable = document.documentElement.scrollHeight - window.innerHeight
    if (scrollable <= 0) return
    const depth = Math.min(100, Math.round((window.scrollY / scrollable) * 100))
    session.maxScrollDepth = Math.max(session.maxScrollDepth, depth)
    SCROLL_DEPTH_MILESTONES.forEach((milestone) => {
      if (depth < milestone || reached.has(milestone)) return
      reached.add(milestone)
      const slide = currentSlide()
      trackInvestor('scroll_depth', { depth_percent: milestone, ...(slide ? slideMetaOnly(slide) : {}) })
    })
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  return () => window.removeEventListener('scroll', onScroll)
}

function slideMetaOnly({ element: _element, ...meta }: SlideMeta & { element: Element }): SlideMeta {
  return meta
}

const CLICKABLE = 'a, button, summary, video, input, select, textarea, label, [role="button"], [data-track]'

function startClickTracking(): () => void {
  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null
    if (!target) return
    const tracked = target.closest('[data-track]')
    const element = tracked || target.closest(CLICKABLE) || target
    session.clickCount += 1
    const anchor = element.closest('a')
    trackInvestor('click', {
      track_id: tracked?.getAttribute('data-track') || null,
      element: element.tagName.toLowerCase(),
      label: textLabel(element),
      href: anchor?.getAttribute('href') || null,
      in_experience_view: Boolean(element.closest('.story-experience')),
      x_ratio: Number((event.clientX / window.innerWidth).toFixed(3)),
      y_ratio: Number((event.clientY / window.innerHeight).toFixed(3)),
      ...slideContext(element),
    })
  }
  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}

function playedSeconds(video: HTMLVideoElement): number {
  let total = 0
  for (let i = 0; i < video.played.length; i += 1) total += video.played.end(i) - video.played.start(i)
  return total
}

/** Detailed playback telemetry for one video; returns a cleanup that flushes the summary. */
export function trackVideo(video: HTMLVideoElement, videoId: string): () => void {
  const stats: VideoStats = session.videos[videoId] || {
    playCount: 0, playedMs: 0, watchedSeconds: 0, maxPositionSeconds: 0, durationSeconds: 0, completed: false,
  }
  session.videos[videoId] = stats
  const reached = new Set<number>()
  let playStartedAt: number | null = null
  let lastPosition = 0
  let summaryDirty = false

  const position = () => Number(video.currentTime.toFixed(1))
  const refresh = () => {
    stats.durationSeconds = Number.isFinite(video.duration) ? Number(video.duration.toFixed(1)) : 0
    stats.watchedSeconds = Number(playedSeconds(video).toFixed(1))
    stats.maxPositionSeconds = Math.max(stats.maxPositionSeconds, position())
  }
  const stopClock = () => {
    if (playStartedAt == null) return
    stats.playedMs += Math.round(performance.now() - playStartedAt)
    playStartedAt = null
  }
  const base = () => ({
    video_id: videoId,
    video_src: video.currentSrc || video.src || null,
    position_seconds: position(),
    duration_seconds: stats.durationSeconds,
    muted: video.muted,
  })
  const summary = (reason: string, beacon = false) => {
    if (!summaryDirty) return
    summaryDirty = false
    stopClock()
    refresh()
    trackInvestor('video_watch_summary', {
      ...base(),
      reason,
      play_count: stats.playCount,
      played_ms: stats.playedMs,
      watched_seconds: stats.watchedSeconds,
      completion_ratio: stats.durationSeconds ? Number((stats.watchedSeconds / stats.durationSeconds).toFixed(3)) : 0,
      max_position_seconds: stats.maxPositionSeconds,
      completed: stats.completed,
    }, beacon)
  }

  const onPlay = () => {
    stats.playCount += 1
    playStartedAt = performance.now()
    summaryDirty = true
    refresh()
    trackInvestor('video_play', { ...base(), play_count: stats.playCount })
  }
  const onPause = () => {
    if (video.ended) return
    stopClock()
    refresh()
    trackInvestor('video_pause', { ...base(), watched_seconds: stats.watchedSeconds })
    summary('pause')
  }
  const onSeeked = () => {
    trackInvestor('video_seek', { ...base(), from_seconds: lastPosition, to_seconds: position() })
  }
  const onTimeUpdate = () => {
    if (!video.seeking) lastPosition = position()
    refresh()
    if (!stats.durationSeconds) return
    const percent = (video.currentTime / video.duration) * 100
    VIDEO_PROGRESS_MILESTONES.forEach((milestone) => {
      if (percent + 0.5 < milestone || reached.has(milestone)) return
      reached.add(milestone)
      trackInvestor('video_progress', { ...base(), percent: milestone })
    })
  }
  const onEnded = () => {
    stats.completed = true
    stopClock()
    refresh()
    trackInvestor('video_ended', base())
    summary('ended')
  }
  const onVolume = () => trackInvestor('video_volume', { ...base(), volume: Number(video.volume.toFixed(2)) })
  const onFullscreen = () => {
    if (document.fullscreenElement === video) trackInvestor('video_fullscreen', base())
  }
  const onPageHide = () => summary('pagehide', true)

  video.addEventListener('play', onPlay)
  video.addEventListener('pause', onPause)
  video.addEventListener('seeked', onSeeked)
  video.addEventListener('timeupdate', onTimeUpdate)
  video.addEventListener('ended', onEnded)
  video.addEventListener('volumechange', onVolume)
  document.addEventListener('fullscreenchange', onFullscreen)
  window.addEventListener('pagehide', onPageHide)

  return () => {
    summary('unmount')
    video.removeEventListener('play', onPlay)
    video.removeEventListener('pause', onPause)
    video.removeEventListener('seeked', onSeeked)
    video.removeEventListener('timeupdate', onTimeUpdate)
    video.removeEventListener('ended', onEnded)
    video.removeEventListener('volumechange', onVolume)
    document.removeEventListener('fullscreenchange', onFullscreen)
    window.removeEventListener('pagehide', onPageHide)
  }
}

function summarizeSession() {
  if (session.summarized) return
  session.summarized = true
  pauseSlides?.()
  let longestSlide = ''
  let longestMs = 0
  Object.entries(session.slideDwellMs).forEach(([slide, ms]) => {
    if (ms > longestMs) {
      longestMs = ms
      longestSlide = slide
    }
  })
  trackInvestor('session_summary', {
    total_ms: Math.round(performance.now() - visitStartedAt),
    story_dwell_ms: Object.values(session.slideDwellMs).reduce((sum, ms) => sum + ms, 0),
    slide_dwell_ms: session.slideDwellMs,
    slides_seen: session.slidesSeen.size,
    slides_total: storySlides().length,
    furthest_slide_index: session.furthestSlideIndex,
    longest_slide: longestSlide || null,
    longest_slide_ms: longestMs,
    max_scroll_depth: session.maxScrollDepth,
    click_count: session.clickCount,
    experiences: session.experiences,
    videos: session.videos,
  }, true)
}

/** Boots all deck-level investor telemetry; call once after the story renders. */
export function startStoryTracking({ restored }: { restored: boolean }): () => void {
  const params = new URLSearchParams(window.location.search)
  trackInvestor('story_opened', {
    path: window.location.pathname,
    referrer: document.referrer || null,
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    device_pixel_ratio: window.devicePixelRatio,
    touch: 'ontouchstart' in window,
    language: navigator.language,
    restored_position: restored,
    standalone_route: !snFromLocation(),
  })

  const stops = [startSlideTracking(), startScrollDepthTracking(), startClickTracking()]
  window.addEventListener('pagehide', summarizeSession)

  return () => {
    stops.forEach((stop) => stop())
    window.removeEventListener('pagehide', summarizeSession)
  }
}
