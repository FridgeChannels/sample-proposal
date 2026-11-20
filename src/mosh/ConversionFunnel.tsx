import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import './ConversionFunnel.css'

const LAYERS = [
  {
    id: 'md',
    acronym: 'MD',
    name: 'Magnet Delivered',
    blurb: 'Magnets shipped with product packages.',
    topWidth: 100,
    bottomWidth: 86,
  },
  {
    id: 'msi',
    acronym: 'MSI',
    name: 'Magnet Scanned & Interacted',
    blurb: 'Magnets that complete scan and interaction.',
    topWidth: 78,
    bottomWidth: 62,
  },
  {
    id: 'mgo',
    acronym: 'MGO',
    name: 'Magnet Generated Orders',
    blurb: 'Attributed reorder orders generated through magnets.',
    topWidth: 54,
    bottomWidth: 40,
  },
] as const

const LAYER_RADIUS = 18

function roundedTrapezoid(width: number, height: number, topPct: number, bottomPct: number, radius: number) {
  const topInset = ((100 - topPct) / 100) * width / 2
  const bottomInset = ((100 - bottomPct) / 100) * width / 2
  const points = [
    { x: topInset, y: 0 },
    { x: width - topInset, y: 0 },
    { x: width - bottomInset, y: height },
    { x: bottomInset, y: height },
  ]
  const edges = points.map((start, index) => {
    const end = points[(index + 1) % points.length]
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.hypot(dx, dy) || 1
    return { ux: dx / length, uy: dy / length, length }
  })
  let path = ''
  points.forEach((point, index) => {
    const incoming = edges[(index + points.length - 1) % points.length]
    const outgoing = edges[index]
    const curve = Math.min(radius, incoming.length / 2.2, outgoing.length / 2.2)
    const startX = point.x - incoming.ux * curve
    const startY = point.y - incoming.uy * curve
    const endX = point.x + outgoing.ux * curve
    const endY = point.y + outgoing.uy * curve
    path += index === 0
      ? `M ${startX.toFixed(2)} ${startY.toFixed(2)}`
      : ` L ${startX.toFixed(2)} ${startY.toFixed(2)}`
    path += ` Q ${point.x.toFixed(2)} ${point.y.toFixed(2)} ${endX.toFixed(2)} ${endY.toFixed(2)}`
  })
  return `${path} Z`
}

function FunnelLayer({
  layer,
}: {
  layer: (typeof LAYERS)[number]
}) {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const paint = () => {
      const width = element.offsetWidth
      const height = element.offsetHeight
      if (width < 1 || height < 1) return
      element.style.clipPath = `path('${roundedTrapezoid(width, height, layer.topWidth, layer.bottomWidth, LAYER_RADIUS)}')`
    }
    paint()
    const observer = new ResizeObserver(paint)
    observer.observe(element)
    return () => observer.disconnect()
  }, [layer.topWidth, layer.bottomWidth])

  return (
    <article
      ref={ref}
      className={`conversion-funnel__layer conversion-funnel__layer--${layer.id}`}
      style={{
        ['--trap-top' as string]: `${layer.topWidth}%`,
        ['--trap-bottom' as string]: `${layer.bottomWidth}%`,
      }}
    >
      <p className="conversion-funnel__label">
        <span className="conversion-funnel__abbr">{layer.acronym}</span>
      </p>
    </article>
  )
}

const RATES = [
  { from: 'MD', to: 'MSI', label: 'Activation Rate', value: '40%' },
  { from: 'MSI', to: 'MGO', label: 'Order Conversion Rate', value: '30%' },
] as const

/** 0 = MD · 1 = +40%+MSI · 2 = +30%+MGO · 3 = Cost per reorder */
const MAX_STEP = 3
const ease = [0.22, 1, 0.36, 1] as const

export function ConversionFunnel() {
  const rootRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const [inView, setInView] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const slide = rootRef.current?.closest('section')
    if (!slide) {
      setInView(true)
      return
    }

    const sync = () => {
      const visible = slide.classList.contains('page-in-view') || slide.matches(':focus-within')
      setInView(visible)
      if (!visible) setStep(0)
    }
    sync()

    const observer = new MutationObserver(sync)
    observer.observe(slide, { attributes: true, attributeFilter: ['class'] })
    slide.addEventListener('focusin', sync)
    slide.addEventListener('focusout', sync)

    return () => {
      observer.disconnect()
      slide.removeEventListener('focusin', sync)
      slide.removeEventListener('focusout', sync)
    }
  }, [])

  useEffect(() => {
    const slide = rootRef.current?.closest('section')
    if (!slide || !inView) return

    const advance = (event: Event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('a, button, input, textarea, select, [role="tab"], [role="checkbox"]')) return
      setStep((current) => Math.min(MAX_STEP, current + 1))
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault()
        setStep((current) => Math.min(MAX_STEP, current + 1))
      }
    }

    slide.addEventListener('click', advance)
    slide.addEventListener('keydown', onKey)
    if (!slide.hasAttribute('tabindex')) slide.tabIndex = 0

    return () => {
      slide.removeEventListener('click', advance)
      slide.removeEventListener('keydown', onKey)
    }
  }, [inView])

  const t = reduceMotion ? { duration: 0 } : { duration: 0.48, ease }
  const showLayer = (index: number) => step >= index
  const showRate = (index: number) => step >= index + 1
  const showFormula = step >= 3
  const complete = step >= MAX_STEP

  return (
    <div
      ref={rootRef}
      className={`conversion-funnel${inView ? ' is-active' : ''}${complete ? ' is-complete' : ''}`}
      data-step={step}
    >
      <div className={`conversion-funnel__body${showFormula ? ' has-formula' : ''}`}>
        <motion.div
          className="conversion-funnel__funnel"
          aria-label="Animated conversion funnel"
        >
          {LAYERS.map((layer, index) => (
            <div key={layer.id} className="conversion-funnel__step">
              <AnimatePresence>
                {showLayer(index) && (
                  <motion.div
                    className="conversion-funnel__row"
                    initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={t}
                  >
                    <div className="conversion-funnel__band">
                      <FunnelLayer layer={layer} />
                    </div>
                    <p className="conversion-funnel__blurb">
                      <strong>
                        {layer.name} ({layer.acronym})
                      </strong>
                      <span aria-hidden="true"> ：</span>
                      {layer.blurb}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {index < RATES.length && (
                <AnimatePresence>
                  {showRate(index) && (
                    <motion.div
                      className="conversion-funnel__node-slot"
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={t}
                    >
                      <div className="conversion-funnel__node">
                        <span className="conversion-funnel__node-stem" aria-hidden="true" />
                        <span className="conversion-funnel__node-dot" aria-hidden="true" />
                        <span className="conversion-funnel__node-value">{RATES[index].value}</span>
                        <span className="conversion-funnel__node-meta">
                          {RATES[index].label}
                          <span>
                            {RATES[index].from} → {RATES[index].to}
                          </span>
                        </span>
                        <span className="conversion-funnel__node-stem conversion-funnel__node-stem--after" aria-hidden="true" />
                      </div>
                      {/* Invisible spacers keep node centered on the funnel band, not the full row */}
                      <span className="conversion-funnel__blurb conversion-funnel__blurb--spacer" aria-hidden="true">
                        Magnets shipped with product packages.
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}
        </motion.div>

        <AnimatePresence>
          {showFormula && (
            <motion.div
              className="conversion-funnel__formula-row"
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={t}
            >
              <aside className="conversion-funnel__formula" aria-label="Cost per reorder: $0.60 per piece divided by 40% times 30% equals $5">
                <p className="conversion-funnel__formula-title">Cost per reorder</p>
                <span className="conversion-funnel__formula-colon" aria-hidden="true">
                  :
                </span>

                <div className="conversion-funnel__board" aria-label="$0.60 per piece divided by 40% times 30% equals $5">
                  <div className="conversion-funnel__fraction">
                    <span className="conversion-funnel__fraction-num">
                      $0.60<span className="conversion-funnel__fraction-unit"> / piece</span>
                    </span>
                    <span className="conversion-funnel__fraction-line" aria-hidden="true" />
                    <span className="conversion-funnel__fraction-den">
                      <span>40%</span>
                      <span aria-hidden="true">×</span>
                      <span>30%</span>
                    </span>
                  </div>
                  <span className="conversion-funnel__board-eq" aria-hidden="true">
                    =
                  </span>
                  <strong className="conversion-funnel__board-result">$5</strong>
                </div>
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
