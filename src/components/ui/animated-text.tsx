import { motion, useInView, useReducedMotion, type Variants } from 'motion/react'
import { useRef } from 'react'
import './animated-text.css'

export interface AnimatedTextProps {
  text: string
  className?: string
  animationType?: 'letters' | 'words'
  duration?: number
  delay?: number
  staggerDelay?: number
  initialY?: number
  initialOpacity?: number
  animateY?: number
  animateOpacity?: number
}

export default function AnimatedText({
  text,
  className = '',
  animationType = 'letters',
  duration = 0.6,
  delay = 0,
  staggerDelay = 0.05,
  initialY = 10,
  initialOpacity = 0,
  animateY = 0,
  animateOpacity = 1,
}: AnimatedTextProps) {
  const animatedTextRef = useRef<HTMLSpanElement>(null)
  const isInView = useInView(animatedTextRef, { once: true, amount: 0.2 })
  const prefersReducedMotion = useReducedMotion()

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: {
      y: initialY,
      opacity: initialOpacity,
    },
    visible: {
      y: animateY,
      opacity: animateOpacity,
      transition: {
        duration: prefersReducedMotion ? 0 : duration,
        ease: 'easeOut',
      },
    },
  }

  const shouldAnimate = Boolean(prefersReducedMotion || isInView)

  return (
    <span className={`animated-text ${className}`.trim()}>
      <span className="animated-text__sr-only">{text}</span>
      <motion.span
        ref={animatedTextRef}
        aria-hidden="true"
        className="animated-text__visual"
        variants={containerVariants}
        initial={prefersReducedMotion ? false : 'hidden'}
        animate={shouldAnimate ? 'visible' : 'hidden'}
      >
        {animationType === 'letters'
          ? Array.from(text).map((char, index) => (
              <motion.span
                key={`letter-${index}`}
                className="animated-text__letter"
                style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
                variants={itemVariants}
              >
                {char}
              </motion.span>
            ))
          : text.split(/(\s+)/).map((part, index) =>
              /^\s+$/.test(part) ? (
                part
              ) : (
                <motion.span
                  key={`word-${index}`}
                  className="animated-text__word"
                  variants={itemVariants}
                >
                  {part}
                </motion.span>
              ),
            )}
      </motion.span>
    </span>
  )
}
