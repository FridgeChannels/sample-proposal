import { useEffect, useId, useMemo, useRef, useState } from 'react'
import './tilted-grid-hero.css'

const SLICES = 16
const CAMERA = 1.6
const MAX_WIDTH = 55

function arc(bend: number) {
  return (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend))
}

function measure(width: number, height: number, tile: number, ratios: number[], gap: number, bend: number) {
  const maxAspect = Math.max(...ratios, 1)
  const tileHeight = Math.min((tile / 100) * height, ((MAX_WIDTH / 100) * width) / maxAspect)
  const radius = width * arc(bend)
  if (!(tileHeight > 0) || !(radius > 0) || ratios.length === 0) return { copies: 0, sweep: 0, unit: 0, limit: 0 }

  const degrees = (radians: number) => (radians * 180) / Math.PI
  const unit = degrees(tileHeight / radius)
  const sequenceWidth = ratios.reduce((sum, ratio) => sum + ratio + gap / 100, 0)
  const limit = degrees(bend) + (maxAspect * unit) / 2
  const maxCopies = Math.max(1, Math.floor(60 / ratios.length))
  const copies = Math.min(maxCopies, Math.max(1, Math.ceil((2 * limit) / (sequenceWidth * unit))))
  const round = (value: number) => +value.toFixed(4)
  const sweep = round((copies * sequenceWidth * unit) / 2)
  return { copies, sweep, unit: round(unit), limit: round(Math.min(sweep, limit)) }
}

export type TiltedGridImage = {
  src: string
  alt?: string
  type?: 'image' | 'video'
  poster?: string
  aspectRatio?: number
}

type TiltedGridHeroProps = {
  images: TiltedGridImage[]
  speed?: number
  tileHeight?: number
  aspectRatio?: number
  gap?: number
  axis?: number
  curve?: number
  fade?: number
}

/** A continuous row of images, bent into a cylindrical arc. */
export function TiltedGridHero({
  images,
  speed = 4,
  tileHeight = 26,
  aspectRatio = 16 / 9,
  gap = 6,
  axis = 56,
  curve = 80,
  fade = 12,
}: TiltedGridHeroProps) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const orbit = `tgh-o-${id}`
  const tileClass = `tgh-t-${id}`
  const bend = (Math.min(85, Math.max(5, curve)) * Math.PI) / 180
  const [layout, setLayout] = useState<ReturnType<typeof measure> | null>(null)
  const [loadedRatios, setLoadedRatios] = useState<Record<number, number>>({})
  const imageRatios = useMemo(() => images.map((image, index) => {
    const ratio = loadedRatios[index] ?? image.aspectRatio ?? aspectRatio
    return Number.isFinite(ratio) && ratio > 0 ? ratio : 1
  }), [images, loadedRatios, aspectRatio])
  const maxAspectRatio = Math.max(...imageRatios, 1)
  const spacing = Math.max(0, gap) / 100

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const next = measure(width, height, tileHeight, imageRatios, Math.max(0, gap), bend)
      setLayout((previous) => (
        previous?.copies === next.copies && previous.sweep === next.sweep && previous.unit === next.unit && previous.limit === next.limit
          ? previous
          : next
      ))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [tileHeight, imageRatios, gap, bend])

  useEffect(() => {
    let active = true
    images.forEach((image, index) => {
      const source = image.type === 'video' ? image.poster : image.src
      if (!source) return

      const probe = new Image()
      probe.onload = () => {
        if (!active || !probe.naturalWidth || !probe.naturalHeight) return
        const ratio = probe.naturalWidth / probe.naturalHeight
        setLoadedRatios((previous) => previous[index] === ratio ? previous : { ...previous, [index]: ratio })
      }
      probe.src = source
    })
    return () => { active = false }
  }, [images])

  const { copies, sweep, unit, limit } = layout ?? measure(1200, 560, tileHeight, imageRatios, Math.max(0, gap), bend)
  const u = (value: number) => `calc(${+value.toFixed(4)} * min(${tileHeight}cqh, ${+(MAX_WIDTH / maxAspectRatio).toFixed(4)}cqw))`
  const radiusPercent = 100 * arc(bend)
  const radius = `${+radiusPercent.toFixed(3)}cqw`
  const turn = (degrees: number) => `translateZ(${radius}) rotateY(${+degrees.toFixed(4)}deg) translateZ(-${radius})`
  const hide = +(((sweep - limit) / (2 * sweep || 1)) * 100).toFixed(4)
  const animationCss = `@keyframes ${orbit}{from{transform:${turn(-sweep)}}to{transform:${turn(sweep)}}0%,${hide}%,${100 - hide}%,100%{visibility:hidden}${hide + 0.001}%,${100 - hide - 0.001}%{visibility:visible}}` +
    `@media(prefers-reduced-motion:reduce){.${tileClass}{animation-play-state:paused}}`
  const sequenceWidth = imageRatios.reduce((sum, ratio) => sum + ratio + spacing, 0)
  const totalWidth = copies * sequenceWidth
  const duration = Math.max(0.1, speed) * totalWidth / (maxAspectRatio + spacing)
  const mask = `linear-gradient(90deg,transparent,#000 ${fade}%,#000 ${100 - fade}%,transparent)`
  let offset = 0
  const tiles = Array.from({ length: copies * images.length }, (_, index) => {
    const imageIndex = images.length - 1 - index % images.length
    const ratio = imageRatios[imageIndex]
    const center = offset + ratio / 2
    offset += ratio + spacing
    return { image: images[imageIndex], ratio, center }
  })

  return (
    <div ref={ref} className={`tilted-grid-hero${spacing === 0 ? ' tilted-grid-hero--flush' : ''}`} aria-hidden="true">
      <style>{animationCss}</style>
      <div
        className="tilted-grid-band"
        style={{
          opacity: layout ? 1 : 0,
          perspective: `${+(radiusPercent * CAMERA).toFixed(3)}cqw`,
          perspectiveOrigin: `50% ${axis}%`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {tiles.map(({ image, ratio, center }, index) => {
          const share = ratio / SLICES
          return (
            <div
              key={index}
              className={`tilted-grid-tile ${tileClass}`}
              style={{
                left: `calc(50% - ${u(ratio / 2)})`,
                top: `calc(${axis}% - ${u(0.5)})`,
                width: u(ratio),
                height: u(1),
                transformStyle: 'preserve-3d',
                animation: `${orbit} ${duration}s linear ${-(center / totalWidth) * duration}s infinite`,
              }}
            >
              {Array.from({ length: SLICES }, (_, slice) => (
                <div
                  key={slice}
                  className={`tilted-grid-strip${slice === 0 ? ' tilted-grid-strip-first' : ''}${slice === SLICES - 1 ? ' tilted-grid-strip-last' : ''}`}
                  style={{
                    left: u((ratio - share) / 2),
                    width: slice === SLICES - 1 && spacing > 0 ? u(share) : `calc(${u(share)} + 1px)`,
                    height: u(1),
                    transform: turn((ratio / 2 - (slice + 0.5) * share) * unit),
                  }}
                >
                  {image && (image.type === 'video' ? (
                    <video
                      key={image.src}
                      src={image.src}
                      poster={image.poster}
                      aria-hidden="true"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      className="tilted-grid-image"
                      style={{ left: u(-slice * share), width: u(ratio), height: u(1) }}
                    />
                  ) : (
                    <img
                      src={image.src}
                      alt=""
                      draggable={false}
                      className="tilted-grid-image"
                      style={{ left: u(-slice * share), width: u(ratio), height: u(1) }}
                    />
                  ))}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
