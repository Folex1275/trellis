import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// React Testing Library does not auto-clean when `globals` are enabled via
// vite.config.ts rather than a test-runner preset, so unmount explicitly.
// Without this, queries leak across tests and duplicate-element errors appear.
afterEach(() => {
  cleanup()
})
