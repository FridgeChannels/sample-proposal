"use client"

import { useEffect, useRef, useState, type ElementType } from 'react'
import './particle-title.css'

type RGB = [number, number, number]
type Box = { x: number; y: number; w: number; h: number }
type Field = { cx: number; cy: number; rx: number; ry: number }
type Mode = 'smoke' | 'vortex' | 'sand' | 'burst' | 'sweep' | 'absorb'
type Blob = { rgb: RGB; a: number; fx: number; fy: number; fw: number; fh: number }
type Palette = { ink: RGB; page: RGB; blobs: Blob[] }

const MODES: Mode[] = ['smoke', 'vortex', 'sand', 'burst', 'sweep', 'absorb']
const TIMING = { hold: 5200, field: 1400, travel: 4200 }

const LIGHT: Palette = {
  ink: [32, 32, 32],
  page: [244, 245, 247],
  blobs: [
    { rgb: [176, 196, 214], a: 0.55, fx: 0.04, fy: 0.08, fw: 0.62, fh: 0.78 },
    { rgb: [255, 255, 255], a: 0.85, fx: 0.44, fy: 0.22, fw: 0.54, fh: 0.7 },
    { rgb: [226, 208, 196], a: 0.42, fx: 0.3, fy: 0.44, fw: 0.44, fh: 0.56 },
  ],
}

const DARK: Palette = {
  ink: [244, 244, 246],
  page: [12, 12, 14],
  blobs: [
    { rgb: [86, 112, 160], a: 0.5, fx: 0.04, fy: 0.08, fw: 0.62, fh: 0.78 },
    { rgb: [140, 130, 190], a: 0.28, fx: 0.44, fy: 0.22, fw: 0.54, fh: 0.7 },
    { rgb: [150, 104, 84], a: 0.34, fx: 0.3, fy: 0.44, fw: 0.44, fh: 0.56 },
  ],
}

function createRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t)
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (t: number) => {
  const c = clamp(t)
  return c * c * (3 - 2 * c)
}
const ease = (t: number) => {
  const c = clamp(t)
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2
}

function createModeBag(seed: number): () => Mode {
  const r = createRng(seed)
  let bag: Mode[] = []
  let last: Mode | null = null
  return () => {
    if (!bag.length) {
      bag = MODES.slice()
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1))
        ;[bag[i], bag[j]] = [bag[j], bag[i]]
      }
      if (bag[bag.length - 1] === last) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]]
    }
    last = bag.pop() as Mode
    return last
  }
}

function blobStrength(b: Blob, area: Box, x: number, y: number) {
  const bw = b.fw * area.w
  const bh = b.fh * area.h
  const cx = area.x + b.fx * area.w + bw / 2
  const cy = area.y + b.fy * area.h + bh / 2
  return Math.max(0, 1 - Math.hypot((x - cx) / (bw / 2), (y - cy) / (bh / 2))) * b.a
}

function rimMask(area: Box, x: number, y: number) {
  const radius = Math.hypot((x - (area.x + area.w / 2)) / (area.w / 2), (y - (area.y + area.h / 2)) / (area.h / 2))
  return radius < 0.55 ? 1 : radius >= 1 ? 0 : 1 - (radius - 0.55) / 0.45
}

function glowAt(palette: Palette, area: Box, x: number, y: number): { c: RGB; s: number } {
  let [r, g, b] = palette.page
  let visibility = 0
  const mask = rimMask(area, x, y)
  for (const blob of palette.blobs) {
    const strength = blobStrength(blob, area, x, y) * mask
    r = mix(r, blob.rgb[0], strength)
    g = mix(g, blob.rgb[1], strength)
    b = mix(b, blob.rgb[2], strength)
    visibility = Math.max(visibility, strength)
  }
  return { c: [r, g, b], s: visibility }
}

function sampleFieldPoint(palette: Palette, rand: () => number, field: Field, area: Box) {
  let best: { x: number; y: number; c: RGB; s: number } | null = null
  for (let k = 0; k < 4; k++) {
    const angle = rand() * 6.2832
    const q = Math.pow(rand(), 0.6)
    const x = field.cx + Math.cos(angle) * field.rx * q
    const y = field.cy + Math.sin(angle) * field.ry * q
    const glow = glowAt(palette, area, x, y)
    if (!best || glow.s > best.s) best = { x, y, c: glow.c, s: glow.s }
  }
  return best as { x: number; y: number; c: RGB; s: number }
}

type Cell = {
  rx: number; ry: number; rw: number; rh: number; hx: number; hy: number; nx: number; ny: number
  r1: number; r2: number; r3: number; size: number; fx: number; fy: number; fc: RGB
  lt: number; bend: number; pa: number
}
type Phase = 'text' | 'dissolving' | 'field' | 'gathering'

function plan(mode: Mode, p: Cell, width: number, height: number) {
  switch (mode) {
    case 'smoke': return { delay: (1 - clamp(p.ny)) * 0.35 + p.r3 * 0.25, bend: (p.r1 - 0.5) * 150 }
    case 'vortex':
      return {
        delay: (Math.hypot(p.hx - width / 2, p.hy - height / 2) / Math.max(1, width)) * 0.9 + p.r3 * 0.15,
        bend: (p.r2 > 0.5 ? 1 : -1) * (90 + p.r1 * 140),
      }
    case 'sand': return { delay: p.nx * 0.6 + p.r3 * 0.18, bend: (p.r1 - 0.5) * 60 }
    case 'burst': return { delay: p.r3 * 0.1, bend: (p.r2 - 0.5) * 26 }
    case 'sweep': return { delay: (1 - p.nx) * 0.6 + p.r3 * 0.18, bend: -(60 + p.r1 * 90) }
    default: return { delay: p.r1 * 0.55, bend: (p.r2 - 0.5) * 100 }
  }
}

function bowAt(a: [number, number], b: [number, number], bend: number, t: number) {
  const e = ease(t)
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const length = Math.hypot(dx, dy) || 1
  const bow = Math.sin(e * Math.PI) * bend
  return [mix(a[0], b[0], e) + (-dy / length) * bow, mix(a[1], b[1], e) + (dx / length) * bow, e] as const
}

const rgbStr = (a: RGB, b: RGB, t: number) => {
  const c = (i: number) => Math.max(0, Math.min(255, Math.round(mix(a[i], b[i], t))))
  return `rgb(${c(0)},${c(1)},${c(2)})`
}

type Engine = { setActive: (on: boolean) => void; resize: () => void; destroy: () => void }

const INTRO_LEAD = 0.08
const FONT_STACK = 'Inter,"PingFang SC","Microsoft YaHei",system-ui,sans-serif'

function createEngine(canvas: HTMLCanvasElement, text: string, palette: Palette): Engine | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const drawingContext = ctx
  const textCanvas = document.createElement('canvas')
  const nextMode = createModeBag((Date.now() & 0xffff) ^ 0x5a5a)
  let width = 0
  let height = 0
  let dpr = 1
  let field: Field = { cx: 0, cy: 0, rx: 0, ry: 0 }
  let box: Box = { x: 0, y: 0, w: 0, h: 0 }
  let parts: Cell[] = []
  let phase: Phase = 'gathering'
  let mode: Mode = nextMode()
  let phaseStart = 0
  let raf = 0
  let timer = 0
  let intro = true
  let active = true
  let destroyed = false

  function reroll() {
    const rand = createRng((Math.random() * 1e9) | 0)
    for (const part of parts) {
      const point = sampleFieldPoint(palette, rand, field, box)
      part.fx = point.x
      part.fy = point.y
      part.fc = point.c
    }
  }

  function build() {
    width = canvas.clientWidth
    height = canvas.clientHeight
    dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.max(1, Math.round(width * dpr))
    canvas.height = Math.max(1, Math.round(height * dpr))
    textCanvas.width = canvas.width
    textCanvas.height = canvas.height
    drawingContext.setTransform(1, 0, 0, 1, 0, 0)

    const lines = text.split('\n')
    const fs = Math.max(26, Math.min(64, width * 0.12))
    const lineHeight = fs * 1.08
    const centerY = height / 2
    box = { x: 0, y: 0, w: width, h: height }
    field = { cx: width / 2, cy: height / 2, rx: Math.min(560, width * 0.4), ry: Math.min(260, height * 0.3) }

    const textContext = textCanvas.getContext('2d') as CanvasRenderingContext2D
    textContext.setTransform(dpr, 0, 0, dpr, 0, 0)
    textContext.clearRect(0, 0, width, height)
    textContext.font = `500 ${fs}px ${FONT_STACK}`
    textContext.textAlign = 'center'
    textContext.textBaseline = 'middle'
    const lineWidths = lines.map((line) => textContext.measureText(line).width)
    const textWidth = Math.max(...lineWidths)
    const textHeight = lines.length * lineHeight
    textContext.fillStyle = `rgba(${palette.ink.join(',')},.95)`
    lines.forEach((line, index) => {
      textContext.fillText(line, width / 2, centerY + (index - (lines.length - 1) / 2) * lineHeight)
    })

    const x0 = Math.max(0, Math.floor((width / 2 - textWidth / 2 - 6) * dpr))
    const x1 = Math.min(canvas.width, Math.ceil((width / 2 + textWidth / 2 + 6) * dpr))
    const y0 = Math.max(0, Math.floor((centerY - textHeight / 2 - fs * 0.2) * dpr))
    const y1 = Math.min(canvas.height, Math.ceil((centerY + textHeight / 2 + fs * 0.2) * dpr))
    const data = textContext.getImageData(0, 0, canvas.width, canvas.height).data
    let cellSize = Math.max(2, Math.round(3 * dpr))
    let points: number[][]
    for (;;) {
      points = []
      for (let y = y0; y < y1; y += cellSize) {
        for (let x = x0; x < x1; x += cellSize) {
          const cellWidth = Math.min(cellSize, canvas.width - x)
          const cellHeight = Math.min(cellSize, canvas.height - y)
          let hit = false
          for (let yy = y; yy < y + cellHeight && !hit; yy++) {
            for (let xx = x; xx < x + cellWidth; xx++) {
              if (data[(yy * canvas.width + xx) * 4 + 3] > 0) { hit = true; break }
            }
          }
          if (hit) points.push([x, y, cellWidth, cellHeight])
        }
      }
      if (points.length <= 2400) break
      cellSize++
    }

    let minX = 1e9
    let maxX = -1e9
    for (const point of points) {
      point[4] = (point[0] + point[2] / 2) / dpr
      point[5] = (point[1] + point[3] / 2) / dpr
      minX = Math.min(minX, point[4])
      maxX = Math.max(maxX, point[4])
    }
    const rand = createRng(7)
    parts = points.map((point) => {
      const choice = rand()
      const size = choice < 0.62 ? 0.9 + rand() * 0.8 : choice < 0.9 ? 1.8 + rand() * 1.4 : 3.4 + rand() * 3.2
      return {
        rx: point[0], ry: point[1], rw: point[2], rh: point[3], hx: point[4], hy: point[5],
        nx: (point[4] - minX) / Math.max(1, maxX - minX), ny: (point[5] - (centerY - textHeight / 2)) / textHeight,
        r1: rand(), r2: rand(), r3: rand(), size, fx: 0, fy: 0, fc: [0, 0, 0] as RGB, lt: 0, bend: 0, pa: 0,
      }
    })
    drawingContext.setTransform(dpr, 0, 0, dpr, 0, 0)
    reroll()
  }

  function drawRealText() {
    drawingContext.setTransform(1, 0, 0, 1, 0, 0)
    drawingContext.clearRect(0, 0, canvas.width, canvas.height)
    drawingContext.globalAlpha = 1
    drawingContext.drawImage(textCanvas, 0, 0)
    drawingContext.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function frame(now: number) {
    raf = 0
    const lead = intro && phase === 'gathering' ? INTRO_LEAD : 0
    const progress = clamp((now - phaseStart) / TIMING.travel + lead)
    const out = phase === 'dissolving'
    drawingContext.setTransform(1, 0, 0, 1, 0, 0)
    drawingContext.clearRect(0, 0, canvas.width, canvas.height)
    for (const part of parts) {
      const step = plan(mode, part, width, height)
      const localT = clamp((progress - step.delay * 0.55) / 0.45)
      part.lt = localT
      part.bend = step.bend
      part.pa = out ? 1 - smooth(localT / 0.18) : smooth((localT - 0.82) / 0.18)
      if (part.pa <= 0.002) continue
      drawingContext.globalAlpha = part.pa
      drawingContext.drawImage(textCanvas, part.rx, part.ry, part.rw, part.rh, part.rx, part.ry, part.rw, part.rh)
    }
    drawingContext.setTransform(dpr, 0, 0, dpr, 0, 0)
    for (const part of parts) {
      const localT = part.lt
      if (localT <= 0 || localT >= 1) continue
      const a: [number, number] = out ? [part.hx, part.hy] : [part.fx, part.fy]
      const b: [number, number] = out ? [part.fx, part.fy] : [part.hx, part.hy]
      const point = bowAt(a, b, out ? part.bend : -part.bend, localT)
      const e = out ? point[2] : 1 - point[2]
      let alpha = 0.1 + 0.9 * (1 - smooth((e - 0.45) / 0.55))
      alpha *= out ? 1 - smooth((localT - 0.85) / 0.15) : smooth(localT / 0.15) * (1 - part.pa)
      if (alpha <= 0.004) continue
      drawingContext.globalAlpha = Math.min(1, alpha)
      drawingContext.fillStyle = rgbStr(palette.ink, part.fc, smooth(e / 0.6))
      drawingContext.beginPath()
      drawingContext.arc(point[0], point[1], (part.size * mix(1, 1.7, smooth(e))) / 2, 0, 6.2832)
      drawingContext.fill()
    }
    drawingContext.globalAlpha = 1
    if (progress < 1) raf = requestAnimationFrame(frame)
    else advance()
  }

  function stopWork() {
    clearTimeout(timer)
    cancelAnimationFrame(raf)
    raf = 0
  }

  function enter(next: Phase) {
    phase = next
    phaseStart = performance.now()
    stopWork()
    if (!active || destroyed) return
    if (next === 'text') {
      intro = false
      drawRealText()
      timer = window.setTimeout(advance, TIMING.hold)
    } else if (next === 'field') {
      drawingContext.setTransform(1, 0, 0, 1, 0, 0)
      drawingContext.clearRect(0, 0, canvas.width, canvas.height)
      drawingContext.setTransform(dpr, 0, 0, dpr, 0, 0)
      timer = window.setTimeout(advance, TIMING.field)
    } else {
      if (next === 'dissolving') { mode = nextMode(); reroll() }
      frame(performance.now())
    }
  }

  function advance() {
    enter(phase === 'text' ? 'dissolving' : phase === 'dissolving' ? 'field' : phase === 'field' ? 'gathering' : 'text')
  }

  build()
  enter('gathering')
  return {
    setActive(on) {
      if (on === active || destroyed) return
      active = on
      if (on) enter(phase)
      else stopWork()
    },
    resize() {
      if (destroyed) return
      stopWork()
      build()
      if (active) enter(phase)
      else if (phase === 'text') drawRealText()
    },
    destroy() { destroyed = true; active = false; stopWork() },
  }
}

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduce(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return reduce
}

function useIsDark() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const read = () => {
      const explicit = root.classList.contains('dark') || root.dataset.theme === 'dark'
        ? true
        : root.classList.contains('light') || root.dataset.theme === 'light'
          ? false
          : null
      setDark(explicit ?? media.matches)
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] })
    media.addEventListener('change', read)
    return () => { observer.disconnect(); media.removeEventListener('change', read) }
  }, [])
  return dark
}

const cssColor = (color: RGB, alpha: number) => `rgba(${color[0]},${color[1]},${color[2]},${alpha})`

export interface ParticleTitleProps {
  /** Title text. Use newlines to position words on separate lines. */
  text?: string
  /** Preserve semantic heading level where the title is placed. */
  as?: 'h1' | 'h2'
  /** Force a palette or follow the operating system and document theme. */
  theme?: 'light' | 'dark' | 'system'
  className?: string
}

export function ParticleTitle({ text = 'What will you create today?', as = 'h2', theme = 'system', className = '' }: ParticleTitleProps) {
  const reduce = usePrefersReducedMotion()
  const systemDark = useIsDark()
  const dark = theme === 'system' ? systemDark : theme === 'dark'
  const palette = dark ? DARK : LIGHT
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (reduce || !canvas) return
    const engine = createEngine(canvas, text, dark ? DARK : LIGHT)
    if (!engine) return
    let visible = true
    let size = `${canvas.clientWidth}x${canvas.clientHeight}`
    const sync = () => engine.setActive(visible && !document.hidden)
    const intersection = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting
      sync()
    })
    intersection.observe(canvas)
    let resizeTimer = 0
    const resize = new ResizeObserver(() => {
      const next = `${canvas.clientWidth}x${canvas.clientHeight}`
      if (next === size) return
      size = next
      clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => engine.resize(), 200)
    })
    resize.observe(canvas)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => {
      document.removeEventListener('visibilitychange', sync)
      clearTimeout(resizeTimer)
      intersection.disconnect()
      resize.disconnect()
      engine.destroy()
    }
  }, [reduce, dark, text])

  const Heading = as as ElementType

  return (
    <div className={`particle-title ${className}`}>
      <div aria-hidden="true" className="particle-title__glow">
        {palette.blobs.map((blob, index) => (
          <span
            key={index}
            className={`particle-title__blob particle-title__blob--${index + 1}`}
            style={{ background: `radial-gradient(closest-side, ${cssColor(blob.rgb, blob.a)}, ${cssColor(blob.rgb, 0)} 100%)` }}
          />
        ))}
      </div>
      {!reduce && <canvas ref={canvasRef} aria-hidden="true" className="particle-title__canvas" />}
      <Heading
        id={as === 'h1' ? 'investment-story-title' : undefined}
        aria-label={text.replaceAll('\n', ' ')}
        className={reduce ? 'particle-title__heading particle-title__heading--visible' : 'particle-title__heading'}
        style={{ color: cssColor(palette.ink, 0.95) }}
      >
        {text}
      </Heading>
    </div>
  )
}

export default ParticleTitle
