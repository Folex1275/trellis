/**
 * ScrollReveal — wraps children and animates them into view when they enter
 * the viewport.
 *
 * Transform direction (fix for #88):
 *   - When `isVisible` is FALSE  → apply the "from" transform (hidden state).
 *   - When `isVisible` is TRUE   → transition to `transform: none` (visible state).
 *
 * This means elements slide FROM the specified direction INTO their natural
 * position — not the other way around.  Previously, `getTransform` returned
 * the offset when visible and identity when hidden, inverting the animation.
 */
import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'

export type RevealDirection = 'up' | 'down' | 'left' | 'right'

interface ScrollRevealProps {
  children: ReactNode
  /** Direction the element slides in from (default: 'up'). */
  direction?: RevealDirection
  /** Distance the element travels from its off-screen position, in px (default: 40). */
  distance?: number
  /** Transition duration in ms (default: 600). */
  duration?: number
  /** Transition easing (default: 'ease-out'). */
  easing?: string
  /** Delay before the transition starts, in ms (default: 0). */
  delay?: number
  /** Extra CSS classes applied to the wrapper. */
  className?: string
}

/**
 * Returns the CSS transform for the hidden (pre-reveal) state.
 * When `isVisible` becomes true, the element transitions to `transform: none`.
 */
function getFromTransform(direction: RevealDirection, distance: number): string {
  switch (direction) {
    case 'up':    return `translateY(${distance}px)`
    case 'down':  return `translateY(-${distance}px)`
    case 'left':  return `translateX(${distance}px)`
    case 'right': return `translateX(-${distance}px)`
  }
}

export function ScrollReveal({
  children,
  direction = 'up',
  distance = 40,
  duration = 600,
  easing = 'ease-out',
  delay = 0,
  className = '',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const style: CSSProperties = {
    transition: `transform ${duration}ms ${easing} ${delay}ms, opacity ${duration}ms ${easing} ${delay}ms`,
    // Hidden state: offset + transparent.
    // Visible state: natural position + fully opaque.
    transform: isVisible ? 'none' : getFromTransform(direction, distance),
    opacity: isVisible ? 1 : 0,
  }

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  )
}
