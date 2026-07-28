/**
 * TypingText — animates a list of strings one character at a time with a
 * blinking cursor.
 *
 * IMPORTANT: The cursor uses a single CSS animation defined in index.css
 * (`trellis-cursor-blink`).  Do NOT add Tailwind's `animate-pulse` class to
 * the cursor span — it targets the same `opacity` property and produces an
 * unpredictable, browser-inconsistent blink rate (#87).
 */
import { useEffect, useRef, useState } from 'react'

interface TypingTextProps {
  /** Strings to cycle through. */
  phrases: string[]
  /** Typing speed in milliseconds per character (default: 80). */
  typingSpeed?: number
  /** Pause at the end of a phrase before erasing, in ms (default: 2000). */
  pauseDuration?: number
  /** Erasing speed in milliseconds per character (default: 40). */
  erasingSpeed?: number
  /** Extra CSS classes applied to the outer wrapper. */
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
        // Finished typing — pause then start erasing.
        timeoutRef.current = setTimeout(() => setIsTyping(false), pauseDuration)
      }
    } else {
      if (displayText.length > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1))
        }, erasingSpeed)
      } else {
        // Finished erasing — move to next phrase.
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
      {displayText}
      {/* Single animation source: trellis-cursor-blink defined in index.css.
          No animate-pulse here — that class competes for opacity (#87). */}
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
