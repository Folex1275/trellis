import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Animates a typing effect for the given `text` string.
 *
 * Race-condition fix (#94): each animation run is identified by a generation
 * counter stored in a ref. When `text` changes, the generation is incremented
 * and all in-flight timeouts for the old generation become no-ops before they
 * can mutate state. `displayedText` is reset to `''` immediately so no stale
 * characters from the previous text can bleed through.
 *
 * Render-storm fix (#97): characters are appended in configurable batches
 * (`batchSize`, default 3) rather than one at a time, reducing the number of
 * React re-renders for a typical 40-character heading from 40 down to ≤14.
 *
 * Stall recovery (#102): the tick chain is a sequence of chained setTimeout
 * calls — if one link fails to fire (e.g. an unexpected error interrupts the
 * chain), the heading could otherwise be left stuck mid-type with no way to
 * recover. A fallback timer forces the full `text` to display after 10s if
 * the animation for the current generation hasn't finished by then.
 *
 * @param text       The full target string to type out.
 * @param delayMs    Milliseconds between ticks (default 40 ms).
 * @param batchSize  Characters appended per tick (default 3).
 * @returns          The portion of `text` revealed so far.
 */
export function useTypingAnimation(
  text: string,
  delayMs = 40,
  batchSize = 3,
): string {
  const [displayedText, setDisplayedText] = useState('')

  // Monotonically increasing counter — bump on every new `text` value so that
  // closures from the previous animation can detect they are stale.
  const generationRef = useRef(0)

  // Max time to wait before forcing the full text to display (#102).
  const STALL_FALLBACK_MS = 10000

  // typeNextChar is recreated whenever `text`, `delayMs`, or `batchSize`
  // changes so it never closes over a stale value.
  const typeNextChar = useCallback(
    (generation: number, charIndex: number) => {
      // Stale closure guard: if the generation has moved on, do nothing.
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
    // Advance the generation counter — all previous timeouts are now stale.
    const generation = generationRef.current + 1
    generationRef.current = generation

    // Reset immediately so no stale characters linger before the first tick.
    setDisplayedText('')

    if (text.length === 0) return

    // Kick off the first tick after one delay interval.
    const timerId = setTimeout(() => typeNextChar(generation, 0), delayMs)

    // Safety net: if the tick chain stalls for any reason, force the full
    // text to show rather than leaving the heading stuck mid-type.
    const fallbackId = setTimeout(() => {
      if (generation === generationRef.current) setDisplayedText(text)
    }, STALL_FALLBACK_MS)

    return () => {
      // Cancel the very first tick if the effect re-runs before it fires.
      clearTimeout(timerId)
      clearTimeout(fallbackId)
    }
  }, [text, delayMs, typeNextChar])

  return displayedText
}

export default useTypingAnimation
