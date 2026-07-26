// defineConfig comes from vitest/config rather than vite so the `test` block
// below is typed; it is a superset of vite's own defineConfig.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Components render against the DOM, so the whole suite runs in jsdom
    // rather than splitting into separate node/jsdom projects.
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      // Entry point, generated assets and the test harness itself carry no
      // logic worth covering.
      exclude: ['src/main.tsx', 'src/vite-env.d.ts', 'src/test/**'],
    },
  },
})
