// defineConfig comes from vitest/config rather than vite so the `test` block
// below is typed; it is a superset of vite's own defineConfig.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // 'spa' makes the dev server fall back to index.html for any path that
  // isn't a real file, so a hard refresh on a client-side route (e.g.
  // /agreement/123) resolves through React Router instead of 404ing.
  appType: 'spa',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
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
