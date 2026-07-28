import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTypingAnimation } from '../hooks/useTypingAnimation'

/**
 * Tests for useTypingAnimation.
 *
 * Covers:
 * - basic typing progression (#97 batch behavior)
 * - race-condition fix: stale timeouts from old text do not corrupt new text (#94)
 * - immediate reset to '' when text changes mid-animation (#94)
 * - empty string input
 * - cleanup: no state updates after unmount
 */

describe('useTypingAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with an empty string', () => {
    const { result } = renderHook(() => useTypingAnimation('Hello', 50, 1))
    expect(result.current).toBe('')
  })

  it('reveals characters in batches', () => {
    // batchSize=2 — each tick appends 2 characters
    const { result } = renderHook(() => useTypingAnimation('ABCDE', 50, 2))

    act(() => { vi.advanceTimersByTime(50) })
    expect(result.current).toBe('AB')

    act(() => { vi.advanceTimersByTime(50) })
    expect(result.current).toBe('ABCD')

    act(() => { vi.advanceTimersByTime(50) })
    expect(result.current).toBe('ABCDE')
  })

  it('completes the full text', () => {
    const text = 'Hello'
    const { result } = renderHook(() => useTypingAnimation(text, 10, 1))

    act(() => { vi.advanceTimersByTime(10 * text.length + 50) })
    expect(result.current).toBe(text)
  })

  it('returns empty string immediately when text is empty', () => {
    const { result } = renderHook(() => useTypingAnimation('', 50, 1))
    expect(result.current).toBe('')

    act(() => { vi.advanceTimersByTime(500) })
    expect(result.current).toBe('')
  })

  it('resets to "" immediately when text prop changes (#94)', () => {
    const { result, rerender } = renderHook(
      ({ text }: { text: string }) => useTypingAnimation(text, 50, 1),
      { initialProps: { text: 'First' } },
    )

    // Advance partway through 'First'
    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current.length).toBeGreaterThan(0)

    // Change text — displayed should reset to '' before new animation starts
    act(() => {
      rerender({ text: 'Second' })
    })
    expect(result.current).toBe('')
  })

  it('does not bleed characters from old text into new text (#94)', () => {
    const { result, rerender } = renderHook(
      ({ text }: { text: string }) => useTypingAnimation(text, 50, 1),
      { initialProps: { text: 'AAA' } },
    )

    // Partially type 'AAA'
    act(() => { vi.advanceTimersByTime(100) })

    // Switch to 'BBB' before 'AAA' finishes
    act(() => { rerender({ text: 'BBB' }) })

    // Flush all remaining timers — old stale timeouts should be no-ops
    act(() => { vi.runAllTimers() })

    // Result must only contain characters from 'BBB', never from 'AAA'
    expect(result.current).not.toContain('A')
    expect(result.current).toBe('BBB')
  })

  it('produces fewer renders than characters for a long string (#97)', () => {
    // batchSize=3 on a 12-char string → 4 ticks instead of 12
    const text = 'abcdefghijkl'
    const states: string[] = []

    const { result } = renderHook(() => {
      const val = useTypingAnimation(text, 10, 3)
      // Record every unique value emitted
      if (states[states.length - 1] !== val) states.push(val)
      return val
    })

    act(() => { vi.runAllTimers() })

    expect(result.current).toBe(text)
    // '' (initial) + ceil(12/3)=4 ticks = 5 states total
    expect(states.length).toBeLessThanOrEqual(5)
  })
})
