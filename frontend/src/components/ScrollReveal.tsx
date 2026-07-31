import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'

export type RevealDirection = 'up' | 'down' | 'left' | 'right'

interface ScrollRevealProps {
  children: ReactNode
  direction?: RevealDirection
  distance?: number
  duration?: number
  easing?: string
  delay?: number
  className?: string
}

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
    transform: isVisible ? 'none' : getFromTransform(direction, distance),
    opacity: isVisible ? 1 : 0,
  }

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  )
}
