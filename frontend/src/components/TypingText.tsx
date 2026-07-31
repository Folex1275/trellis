import { useEffect, useRef, useState } from 'react'

const CURSOR_BLINK_STYLE = `
  @keyframes trellis-cursor-blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
`

interface TypingTextProps {
  phrases: string[]
  typingSpeed?: number
  pauseDuration?: number
  erasingSpeed?: number
  className?: string
}

export function TypingText({
  phrases,
  typingSpeed = 80,
  pauseDuration = 2000,
  erasingSpeed = 40,
  className = '',
}: TypingTextProps) {
  const [displayText, setDisplayText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!phrases.length) return

    const currentPhrase = phrases[phraseIndex % phrases.length]

    if (isTyping) {
      if (displayText.length < currentPhrase.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1))
        }, typingSpeed)
      } else {
        timeoutRef.current = setTimeout(() => setIsTyping(false), pauseDuration)
      }
    } else {
      if (displayText.length > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1))
        }, erasingSpeed)
      } else {
        setPhraseIndex((i) => i + 1)
        setIsTyping(true)
      }
    }

    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    }
  }, [displayText, isTyping, phraseIndex, phrases, typingSpeed, pauseDuration, erasingSpeed])

  return (
    <span className={className} aria-live="polite" aria-atomic="true">
      <style>{CURSOR_BLINK_STYLE}</style>
      {displayText}
      <span
        aria-hidden="true"
        style={{
          animation: `trellis-cursor-blink 1s step-end infinite`,
          display: 'inline-block',
          marginLeft: '1px',
          width: '2px',
          height: '1em',
          verticalAlign: 'text-bottom',
          backgroundColor: 'currentColor',
        }}
      />
    </span>
  )
}
