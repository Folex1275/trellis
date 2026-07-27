import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  baseX: number
  baseY: number
}

interface Mouse {
  x: number | null
  y: number | null
  speed: number
  lastX: number | null
  lastY: number | null
}

/**
 * Detect low-end devices so we can reduce work per frame.
 *
 * Heuristics used (no single signal is reliable):
 *  - devicePixelRatio ≤ 1  (most low-DPI screens are low-end)
 *  - navigator.hardwareConcurrency ≤ 4  (≤ 4 logical cores)
 *
 * Both must be true to be classified as low-end, which avoids false positives
 * from desktops with DPR=1 external monitors.
 */
function isLowEndDevice(): boolean {
  const lowDpr = window.devicePixelRatio <= 1
  const lowCores =
    typeof navigator.hardwareConcurrency === 'number' &&
    navigator.hardwareConcurrency <= 4
  return lowDpr && lowCores
}

/**
 * Choose a particle count proportional to the visible screen area.
 * Smaller screens (mobile) get fewer particles; low-end devices get an
 * additional 40 % reduction on top.
 */
function resolveParticleCount(width: number, height: number, lowEnd: boolean): number {
  const area = width * height
  // Baseline: 1 particle per 4 000 px², clamped to [30, 120]
  const base = Math.max(30, Math.min(120, Math.round(area / 4_000)))
  return lowEnd ? Math.round(base * 0.6) : base
}

/**
 * Build a spatial grid over the canvas so connection-distance checks are
 * O(n) on average rather than O(n²).
 *
 * Each cell is `cellSize × cellSize` pixels.  For a given particle we only
 * check the 3×3 neighbourhood of cells around it, which limits comparisons
 * to particles that could plausibly be within MAX_DISTANCE.
 */
function buildGrid(
  particles: Particle[],
  cellSize: number,
  cols: number,
  rows: number,
): Map<number, number[]> {
  const grid = new Map<number, number[]>()
  for (let i = 0; i < particles.length; i++) {
    const col = Math.floor(particles[i].x / cellSize)
    const row = Math.floor(particles[i].y / cellSize)
    const key = row * cols + col
    const cell = grid.get(key)
    if (cell) {
      cell.push(i)
    } else {
      grid.set(key, [i])
    }
  }
  return grid
}

export function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef<Mouse>({
    x: null,
    y: null,
    speed: 0,
    lastX: null,
    lastY: null,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let particles: Particle[] = []

    // ── Performance constants ──────────────────────────────────────────────
    const LOW_END = isLowEndDevice()
    /** Target interval between frames in ms. 30fps for low-end, 60fps otherwise. */
    const FRAME_INTERVAL = LOW_END ? 1000 / 30 : 1000 / 60
    let lastFrameTime = 0

    const MAX_DISTANCE = 160
    const MOUSE_RADIUS = 180
    const REPULSION_STRENGTH = 3.5
    const RETURN_SPEED = 0.04
    const PARTICLE_COLOR = '0, 194, 255'
    const LINE_COLOR = '0, 194, 255'
    const BG_COLOR = '#0A0E17'

    /** Cell size for the spatial grid — slightly larger than MAX_DISTANCE so a
     *  single ring of neighbour cells covers the full connection radius. */
    const CELL_SIZE = MAX_DISTANCE + 1

    /**
     * Size the canvas in physical pixels while keeping CSS pixels stable.
     * Using devicePixelRatio gives sharp rendering on HiDPI screens without
     * increasing draw calls (we scale the context instead of the canvas).
     */
    function resize() {
      const dpr = window.devicePixelRatio || 1
      const cssW = window.innerWidth
      const cssH = window.innerHeight
      canvas.width = cssW * dpr
      canvas.height = cssH * dpr
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function createParticles() {
      particles = []
      // Use CSS-pixel dimensions (the transform already accounts for DPR)
      const cssW = window.innerWidth
      const cssH = window.innerHeight
      const count = resolveParticleCount(cssW, cssH, LOW_END)
      for (let i = 0; i < count; i++) {
        const x = Math.random() * cssW
        const y = Math.random() * cssH
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          radius: Math.random() * 2 + 1,
        })
      }
    }

    function drawFrame(timestamp: number) {
      // ── Frame throttling ──────────────────────────────────────────────────
      // On low-end devices we skip frames so the CPU/GPU is not pinned at
      // 60fps — requestAnimationFrame is still used so the browser can batch
      // compositing correctly, we just skip the draw work most ticks.
      const elapsed = timestamp - lastFrameTime
      if (elapsed < FRAME_INTERVAL) {
        animationId = requestAnimationFrame(drawFrame)
        return
      }
      lastFrameTime = timestamp - (elapsed % FRAME_INTERVAL)

      const mouse = mouseRef.current
      const cssW = window.innerWidth
      const cssH = window.innerHeight

      // ── Mouse speed ───────────────────────────────────────────────────────
      if (mouse.lastX !== null && mouse.lastY !== null && mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - mouse.lastX
        const dy = mouse.y - mouse.lastY
        mouse.speed = Math.sqrt(dx * dx + dy * dy)
      }
      mouse.lastX = mouse.x
      mouse.lastY = mouse.y

      // ── Clear ─────────────────────────────────────────────────────────────
      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, cssW, cssH)

      // ── Update + draw particles ───────────────────────────────────────────
      for (const p of particles) {
        p.baseX += p.vx
        p.baseY += p.vy

        if (p.baseX < 0 || p.baseX > cssW) p.vx *= -1
        if (p.baseY < 0 || p.baseY > cssH) p.vy *= -1

        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MOUSE_RADIUS && dist > 0) {
            const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS
            const speedMul = 1 + mouse.speed * 0.08
            const repulsion = force * REPULSION_STRENGTH * speedMul
            p.x += (dx / dist) * repulsion
            p.y += (dy / dist) * repulsion
          }
        }

        p.x += (p.baseX - p.x) * RETURN_SPEED
        p.y += (p.baseY - p.y) * RETURN_SPEED

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${PARTICLE_COLOR}, 0.8)`
        ctx.fill()
      }

      // ── Draw connections via spatial grid (O(n) average) ──────────────────
      const cols = Math.ceil(cssW / CELL_SIZE)
      const rows = Math.ceil(cssH / CELL_SIZE)
      const grid = buildGrid(particles, CELL_SIZE, cols, rows)

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        const col = Math.floor(a.x / CELL_SIZE)
        const row = Math.floor(a.y / CELL_SIZE)

        // Check the 3×3 block of cells around particle i
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nc = col + dc
            const nr = row + dr
            if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue
            const neighbours = grid.get(nr * cols + nc)
            if (!neighbours) continue

            for (const j of neighbours) {
              // Only draw each pair once (i < j)
              if (j <= i) continue
              const b = particles[j]
              const dx = a.x - b.x
              const dy = a.y - b.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist < MAX_DISTANCE) {
                const opacity = (1 - dist / MAX_DISTANCE) * 0.5
                ctx.beginPath()
                ctx.moveTo(a.x, a.y)
                ctx.lineTo(b.x, b.y)
                ctx.strokeStyle = `rgba(${LINE_COLOR}, ${opacity})`
                ctx.lineWidth = 0.8
                ctx.stroke()
              }
            }
          }
        }
      }

      // ── Cursor web ────────────────────────────────────────────────────────
      if (mouse.x !== null && mouse.y !== null) {
        const glowRadius = 6 + mouse.speed * 0.3
        const gradient = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, glowRadius * 3,
        )
        gradient.addColorStop(0, 'rgba(0, 194, 255, 0.9)')
        gradient.addColorStop(0.4, 'rgba(0, 194, 255, 0.4)')
        gradient.addColorStop(1, 'rgba(0, 194, 255, 0)')
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, glowRadius * 3, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        for (const p of particles) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MOUSE_RADIUS) {
            const opacity = (1 - dist / MOUSE_RADIUS) * 0.9
            const lineWidth = (1 - dist / MOUSE_RADIUS) * 1.5
            ctx.beginPath()
            ctx.moveTo(mouse.x, mouse.y)
            ctx.lineTo(p.x, p.y)
            ctx.strokeStyle = `rgba(${LINE_COLOR}, ${opacity})`
            ctx.lineWidth = lineWidth
            ctx.stroke()

            ctx.beginPath()
            ctx.arc(p.x, p.y, p.radius + 1.5, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${PARTICLE_COLOR}, ${opacity})`
            ctx.fill()
          }
        }
      }

      animationId = requestAnimationFrame(drawFrame)
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
    }

    const handleMouseLeave = () => {
      mouseRef.current.x = null
      mouseRef.current.y = null
      mouseRef.current.speed = 0
    }

    const handleResize = () => {
      resize()
      createParticles()
    }

    resize()
    createParticles()
    animationId = requestAnimationFrame(drawFrame)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
      style={{ display: 'block', cursor: 'none' }}
    />
  )
}
