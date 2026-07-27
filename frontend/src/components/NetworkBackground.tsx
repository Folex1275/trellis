import { useEffect, useRef } from 'react'

/** Depth layer for a particle — controls size, speed, and opacity. */
type Layer = 0 | 1 | 2

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  baseX: number
  baseY: number
  /** Depth layer: 0 = back (small, slow), 1 = mid, 2 = front (large, fast). */
  layer: Layer
}

interface Mouse {
  x: number | null
  y: number | null
  speed: number
  lastX: number | null
  lastY: number | null
}

/**
 * Three pre-allocated buckets — one per depth layer. Populated once on
 * creation and cleared/refilled on resize instead of being re-allocated every
 * frame via filter().
 *
 * Issue #98: eliminates ~180 array allocations/second (3 filter() calls × 60fps)
 * that would otherwise cause periodic GC pauses and frame stuttering.
 */
type LayerBuckets = [Particle[], Particle[], Particle[]]

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
    const ctx = canvas!.getContext('2d')
    if (!ctx) return

    let animationId: number
    let particles: Particle[] = []

    // Pre-indexed buckets — populated once, reused every frame (no per-frame
    // allocation). Index matches the Layer value (0, 1, 2).
    const layerBuckets: LayerBuckets = [[], [], []]

    const PARTICLE_COUNT = 90
    const MAX_DISTANCE = 160
    const MOUSE_RADIUS = 180
    const REPULSION_STRENGTH = 3.5
    const RETURN_SPEED = 0.04
    const PARTICLE_COLOR = '0, 194, 255'
    const LINE_COLOR = '0, 194, 255'
    // Mirrors the navy-900 design token from tailwind.config.ts.
    // Canvas 2D API requires a literal color string — Tailwind classes cannot
    // be used here, so this is the one intentional exception to the token rule.
    const BG_COLOR = '#0A0E17'

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }

    /**
     * Assigns particles to their layer buckets.
     *
     * Uses in-place array clearing (bucket.length = 0) rather than creating
     * new arrays so that existing array objects are reused across frames.
     */
    function rebuildBuckets() {
      layerBuckets[0].length = 0
      layerBuckets[1].length = 0
      layerBuckets[2].length = 0

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        layerBuckets[p.layer].push(p)
      }
    }

    function createParticles() {
      particles = []
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = Math.random() * canvas!.width
        const y = Math.random() * canvas!.height
        // Distribute particles evenly across three depth layers.
        const layer = (i % 3) as Layer
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          radius: Math.random() * 2 + 1,
          layer,
        })
      }
      // Build buckets once after creation — never rebuilt unless particles
      // change (i.e., only on resize, not every frame).
      rebuildBuckets()
    }

    function drawFrame() {
      const mouse = mouseRef.current

      // Calculate mouse speed
      if (mouse.lastX !== null && mouse.lastY !== null && mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - mouse.lastX
        const dy = mouse.y - mouse.lastY
        mouse.speed = Math.sqrt(dx * dx + dy * dy)
      }
      mouse.lastX = mouse.x
      mouse.lastY = mouse.y

      // Clear background
      ctx!.fillStyle = BG_COLOR
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)

      // Update and draw particles — iterate over the flat particles array so
      // all particles are updated in a single pass with no allocations.
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Natural drift movement
        p.baseX += p.vx
        p.baseY += p.vy

        // Bounce base position off edges
        if (p.baseX < 0 || p.baseX > canvas!.width) p.vx *= -1
        if (p.baseY < 0 || p.baseY > canvas!.height) p.vy *= -1

        // Mouse repulsion
        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < MOUSE_RADIUS) {
            const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS
            const speedMultiplier = 1 + mouse.speed * 0.08
            const repulsion = force * REPULSION_STRENGTH * speedMultiplier
            p.x += (dx / distance) * repulsion
            p.y += (dy / distance) * repulsion
          }
        }

        // Gently return toward base position
        p.x += (p.baseX - p.x) * RETURN_SPEED
        p.y += (p.baseY - p.y) * RETURN_SPEED

        // Draw particle dot — opacity scales slightly with depth layer
        const layerOpacity = 0.5 + p.layer * 0.15
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${PARTICLE_COLOR}, ${layerOpacity})`
        ctx!.fill()
      }

      // Draw standard connecting lines between particles.
      // Iterate over pre-indexed layer buckets so each layer can be rendered
      // independently (e.g., back-layer particles only connect to other
      // back-layer particles) without a filter() call each frame.
      for (let layer = 0; layer < 3; layer++) {
        const bucket = layerBuckets[layer]
        for (let i = 0; i < bucket.length; i++) {
          for (let j = i + 1; j < bucket.length; j++) {
            const dx = bucket[i].x - bucket[j].x
            const dy = bucket[i].y - bucket[j].y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < MAX_DISTANCE) {
              const opacity = (1 - distance / MAX_DISTANCE) * 0.5
              ctx!.beginPath()
              ctx!.moveTo(bucket[i].x, bucket[i].y)
              ctx!.lineTo(bucket[j].x, bucket[j].y)
              ctx!.strokeStyle = `rgba(${LINE_COLOR}, ${opacity})`
              ctx!.lineWidth = 0.8
              ctx!.stroke()
            }
          }
        }
      }

      // Draw cursor web — glowing lines from cursor to nearby nodes
      if (mouse.x !== null && mouse.y !== null) {
        // Draw glowing cursor dot
        const glowRadius = 6 + mouse.speed * 0.3
        const gradient = ctx!.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, glowRadius * 3
        )
        gradient.addColorStop(0, 'rgba(0, 194, 255, 0.9)')
        gradient.addColorStop(0.4, 'rgba(0, 194, 255, 0.4)')
        gradient.addColorStop(1, 'rgba(0, 194, 255, 0)')
        ctx!.beginPath()
        ctx!.arc(mouse.x, mouse.y, glowRadius * 3, 0, Math.PI * 2)
        ctx!.fillStyle = gradient
        ctx!.fill()

        // Draw web lines from cursor to nearby particles — for loop avoids a
        // filter() call that would allocate a temporary array every frame.
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i]
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < MOUSE_RADIUS) {
            const opacity = (1 - distance / MOUSE_RADIUS) * 0.9
            const lineWidth = (1 - distance / MOUSE_RADIUS) * 1.5

            ctx!.beginPath()
            ctx!.moveTo(mouse.x, mouse.y)
            ctx!.lineTo(p.x, p.y)
            ctx!.strokeStyle = `rgba(${LINE_COLOR}, ${opacity})`
            ctx!.lineWidth = lineWidth
            ctx!.stroke()

            // Make nearby particles glow brighter
            ctx!.beginPath()
            ctx!.arc(p.x, p.y, p.radius + 1.5, 0, Math.PI * 2)
            ctx!.fillStyle = `rgba(${PARTICLE_COLOR}, ${opacity})`
            ctx!.fill()
          }
        }
      }

      animationId = requestAnimationFrame(drawFrame)
    }

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
    }

    // Mouse leave handler — cursor leaves window
    const handleMouseLeave = () => {
      mouseRef.current.x = null
      mouseRef.current.y = null
      mouseRef.current.speed = 0
    }

    // Window resize handler
    const handleResize = () => {
      resize()
      createParticles()
    }

    // Initialize
    resize()
    createParticles()
    drawFrame()

    // Event listeners
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('resize', handleResize)

    // Cleanup
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
