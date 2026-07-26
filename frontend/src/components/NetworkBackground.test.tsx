import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NetworkBackground } from './NetworkBackground'

/**
 * jsdom ships no canvas backend, so the component gets a recording stub. Only
 * the calls the draw loop actually makes are implemented — anything missing
 * would surface as a TypeError inside the frame rather than a silent no-op.
 */
function createContextStub() {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  }
}

let ctx: ReturnType<typeof createContextStub>

beforeEach(() => {
  ctx = createContextStub()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  )
  // Swallow the recursive schedule so the loop runs exactly one frame per
  // render instead of spinning for the lifetime of the test run.
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  )
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('<NetworkBackground />', () => {
  it('renders a full-bleed canvas behind the page content', () => {
    const { container } = render(<NetworkBackground />)

    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveClass('absolute', 'inset-0', 'z-0')
  })

  it('sizes the canvas to the viewport', () => {
    const { container } = render(<NetworkBackground />)

    const canvas = container.querySelector('canvas')!
    expect(canvas.width).toBe(window.innerWidth)
    expect(canvas.height).toBe(window.innerHeight)
  })

  it('paints a frame and schedules the next one', () => {
    render(<NetworkBackground />)

    expect(ctx.fillRect).toHaveBeenCalled()
    expect(ctx.arc).toHaveBeenCalled()
    expect(requestAnimationFrame).toHaveBeenCalled()
  })

  it('tears down its animation frame and window listeners on unmount', () => {
    const removeEventListener = vi.spyOn(window, 'removeEventListener')

    const { unmount } = render(<NetworkBackground />)
    unmount()

    expect(cancelAnimationFrame).toHaveBeenCalled()
    const removed = removeEventListener.mock.calls.map(([event]) => event)
    expect(removed).toEqual(expect.arrayContaining(['mousemove', 'mouseleave', 'resize']))
  })

  it('renders without drawing when no 2d context is available', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    const { container } = render(<NetworkBackground />)

    expect(container.querySelector('canvas')).toBeInTheDocument()
    expect(ctx.fillRect).not.toHaveBeenCalled()
  })
})
