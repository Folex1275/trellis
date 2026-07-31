/**
 * Tests for useContractStats (covers issues #91, #92, #93)
 *
 * The hook is tested via a thin wrapper component so React's rules-of-hooks
 * are satisfied without needing @testing-library/react-hooks.
 */
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useContractStats } from './useContractStats'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../lib/config', () => ({
  CONTRACT_ID: 'CTEST',
  RPC_URL: 'https://rpc.example.com',
  NETWORK_PASSPHRASE: 'Test',
}))

// Mock only the xdr namespace used for topic encoding
vi.mock('@stellar/stellar-sdk', () => ({
  xdr: {
    ScVal: {
      scvSymbol: (s: string) => ({
        toXDR: (_enc: string) => Buffer.from(s).toString('base64'),
      }),
    },
  },
}))

// ── Wrapper component ─────────────────────────────────────────────────────────

function StatsDisplay() {
  const { stats, status, lastUpdated } = useContractStats()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="agreements">{stats?.agreements ?? 'null'}</span>
      <span data-testid="milestones">{stats?.milestonesLocked ?? 'null'}</span>
      <span data-testid="lastUpdated">{lastUpdated ?? 'null'}</span>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockFetchSuccess(agreements: number, milestones: number) {
  let call = 0
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => {
      call++
      const count = call % 2 === 1 ? agreements : milestones
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ jsonrpc: '2.0', id: 1, result: { events: Array(count).fill({}), latestLedger: 100 } }),
      })
    }),
  )
}

function mockFetchNetworkError() {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')))
}

function mockFetchRpcError() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ jsonrpc: '2.0', id: 1, error: { code: -32600, message: 'Invalid request' } }),
    }),
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useContractStats', () => {
  it('starts in loading state', () => {
    mockFetchSuccess(3, 5)
    render(<StatsDisplay />)
    expect(screen.getByTestId('status').textContent).toBe('loading')
  })

  it('transitions to ok with real event counts after successful fetch', async () => {
    mockFetchSuccess(3, 7)
    render(<StatsDisplay />)

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('ok')
    })
    expect(screen.getByTestId('agreements').textContent).toBe('3')
    expect(screen.getByTestId('milestones').textContent).toBe('7')
  })

  it('records lastUpdated timestamp on success', async () => {
    mockFetchSuccess(1, 2)
    render(<StatsDisplay />)

    await waitFor(() => {
      expect(screen.getByTestId('lastUpdated').textContent).not.toBe('null')
    })
  })

  it('transitions to error (not zero) when first fetch fails — fix for #93', async () => {
    mockFetchNetworkError()
    render(<StatsDisplay />)

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('error')
    })
    // stats must remain null — never show fabricated zeros
    expect(screen.getByTestId('agreements').textContent).toBe('null')
    expect(screen.getByTestId('milestones').textContent).toBe('null')
  })

  it('shows stale (not zero) when a subsequent fetch fails — fix for #93', async () => {
    // First fetch succeeds
    mockFetchSuccess(2, 4)
    render(<StatsDisplay />)

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ok'))

    // Swap to failing fetch for the next poll
    mockFetchNetworkError()
    vi.advanceTimersByTime(60_001)

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('stale')
    })
    // Stale data from last success must still be visible
    expect(screen.getByTestId('agreements').textContent).toBe('2')
    expect(screen.getByTestId('milestones').textContent).toBe('4')
  })

  it('surfaces RPC-level error responses as errors — fix for #93', async () => {
    mockFetchRpcError()
    render(<StatsDisplay />)

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('error')
    })
    expect(screen.getByTestId('agreements').textContent).toBe('null')
  })

  it('does not contain a hardcoded TVL multiplier — fix for #91', () => {
    // The hook source must not contain "* 1000" or "estimatedUsdc"
    const src = useContractStats.toString()
    expect(src).not.toMatch(/\*\s*1000/)
    expect(src).not.toMatch(/estimatedUsdc/)
  })

  it('encodes topic filters at runtime via xdr, not hardcoded base64 — fix for #92', async () => {
    const xdrModule = await import('@stellar/stellar-sdk')
    const scvSymbolSpy = vi.spyOn(xdrModule.xdr.ScVal, 'scvSymbol')

    mockFetchSuccess(0, 0)
    render(<StatsDisplay />)

    await waitFor(() => expect(screen.getByTestId('status').textContent).not.toBe('loading'))

    // scvSymbol must have been called for both topic strings
    const calls = scvSymbolSpy.mock.calls.map(([s]) => s)
    expect(calls).toContain('created')
    expect(calls).toContain('locked')
  })
})
