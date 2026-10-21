import { motion, useInView, useReducedMotion, type Transition } from 'motion/react'
import { type ElementType, useMemo, useRef } from 'react'
import { cn } from '../../lib/utils'
import './TextGenerateEffect.css'

export type TextGenerateEffectProps = {
  children: string
  as?: ElementType
  className?: string
  wordClassName?: string
  trigger?: boolean
  staggerDuration?: number
  startDelay?: number
  transition?: Transition
  filter?: boolean
  emphasis?: string
}

export function TextGenerateEffect({
  children,
  as = 'p',
  className,
  wordClassName,
  trigger = true,
  staggerDuration = 0.1,
  startDelay = 0,
  transition = { duration: 0.5 },
  filter = true,
  emphasis,
}: TextGenerateEffectProps) {
  const words = useMemo(() => children.split(' '), [children])
  const emphasisWords = useMemo(() => emphasis?.split(' ') ?? [], [emphasis])
  const emphasisStart = useMemo(() => {
    if (!emphasisWords.length) return -1
    return words.findIndex((_, index) => words.slice(index, index + emphasisWords.length).join(' ') === emphasisWords.join(' '))
  }, [emphasisWords, words])
  const ref = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(ref, { once: true, amount: 0.18 })
  const prefersReducedMotion = useReducedMotion()
  const shouldReveal = trigger && isInView
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div

  return (
    <MotionTag
      ref={ref}
      aria-label={children}
      className={cn('text-generate-effect', className)}
    >
      <span className="text-generate-effect__sr-only">{children}</span>
      {words.flatMap((word, index) => {
        const emphasized = emphasisStart >= 0 && index >= emphasisStart && index < emphasisStart + emphasisWords.length

        return [
          <motion.span
            key={`${index}-${word}`}
            animate={{
              filter: filter && !prefersReducedMotion ? (shouldReveal ? 'blur(0px)' : 'blur(4px)') : undefined,
              opacity: shouldReveal || prefersReducedMotion ? 1 : 0,
            }}
            aria-hidden="true"
            className={cn('text-generate-effect__word', wordClassName)}
            initial={prefersReducedMotion ? false : { filter: filter ? 'blur(4px)' : undefined, opacity: 0 }}
            transition={{ ...transition, delay: startDelay + index * staggerDuration }}
          >
            {emphasized ? <strong>{word}</strong> : word}
          </motion.span>,
          ...(index < words.length - 1 ? [' '] : []),
        ]
      })}
    </MotionTag>
  )
}

export default TextGenerateEffect
