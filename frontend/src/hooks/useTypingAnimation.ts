import { useCallback, useEffect, useRef, useState } from 'react'

export function useTypingAnimation(
  text: string,
  delayMs = 40,
  batchSize = 3,
): string {
  const [displayedText, setDisplayedText] = useState('')

  const generationRef = useRef(0)

  const STALL_FALLBACK_MS = 10000

  const typeNextChar = useCallback(
    (generation: number, charIndex: number) => {
      if (generation !== generationRef.current) return

      if (charIndex >= text.length) return

      const nextIndex = Math.min(charIndex + batchSize, text.length)
      setDisplayedText(text.slice(0, nextIndex))

      if (nextIndex < text.length) {
        setTimeout(() => typeNextChar(generation, nextIndex), delayMs)
      }
    },
    [text, delayMs, batchSize],
  )

  useEffect(() => {
    const generation = generationRef.current + 1
    generationRef.current = generation

    setDisplayedText('')

    if (text.length === 0) return

    const timerId = setTimeout(() => typeNextChar(generation, 0), delayMs)

    const fallbackId = setTimeout(() => {
      if (generation === generationRef.current) setDisplayedText(text)
    }, STALL_FALLBACK_MS)

    return () => {
      clearTimeout(timerId)
      clearTimeout(fallbackId)
    }
  }, [text, delayMs, typeNextChar])

  return displayedText
}

export default useTypingAnimation
