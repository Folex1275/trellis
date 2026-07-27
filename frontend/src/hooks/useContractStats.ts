import { useCallback, useEffect, useRef, useState } from 'react'
import { xdr } from '@stellar/stellar-sdk'
import { CONTRACT_ID, RPC_URL } from '../lib/config'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ContractStats {
  /** Number of agreements that have been created. */
  agreements: number
  /** Number of milestones that have been funded (locked). */
  milestonesLocked: number
}

export type StatsStatus =
  | 'loading'   // initial fetch in progress
  | 'ok'        // last poll succeeded
  | 'stale'     // last poll failed, showing data from previous successful poll
  | 'error'     // never succeeded — no data available

export interface UseContractStatsResult {
  stats: ContractStats | null
  status: StatsStatus
  /** ISO timestamp of last successful fetch, or null if never succeeded. */
  lastUpdated: string | null
}

// ── Topic encoding ────────────────────────────────────────────────────────────

/**
 * Encode an event topic symbol string into base64-encoded XDR at runtime,
 * using the same stellar-sdk that decodes it server-side.
 *
 * This replaces hardcoded base64 strings (fix for #92).  If the XDR encoding
 * ever changes with an SDK upgrade the encoding here changes in step with it,
 * so the filters never silently drift out of sync.
 */
function encodeTopicFilter(symbol: string): string {
  const scVal = xdr.ScVal.scvSymbol(symbol)
  return scVal.toXDR('base64')
}

// ── RPC helpers ───────────────────────────────────────────────────────────────

interface RpcEventFilter {
  type: 'contract'
  contractIds: string[]
  topics: string[][]
}

interface RpcGetEventsRequest {
  jsonrpc: '2.0'
  id: number
  method: 'getEvents'
  params: {
    startLedger: number
    filters: RpcEventFilter[]
    pagination?: { limit: number }
  }
}

interface RpcGetEventsResponse {
  jsonrpc: string
  id: number
  result?: {
    events: unknown[]
    latestLedger: number
  }
  error?: {
    code: number
    message: string
  }
}

/**
 * Fetch contract events for a given topic (e.g. "created", "locked") from the
 * Soroban RPC endpoint.
 *
 * Returns the event count on success.
 * Throws on network / RPC-level errors so the caller can distinguish between
 * "zero events" and "failed to fetch" (fix for #93).
 */
async function fetchEventCount(topicSymbol: string, signal: AbortSignal): Promise<number> {
  const topicXdr = encodeTopicFilter(topicSymbol)

  const body: RpcGetEventsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getEvents',
    params: {
      // Horizon testnet keeps ~30 days of ledger history; start from ledger 0
      // is rejected by some nodes, so use 1.  The server will clamp to its own
      // oldest available ledger.
      startLedger: 1,
      filters: [
        {
          type: 'contract',
          contractIds: [CONTRACT_ID],
          topics: [[topicXdr]],
        },
      ],
      pagination: { limit: 200 },
    },
  }

  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    throw new Error(`RPC HTTP ${response.status}: ${response.statusText}`)
  }

  const json: RpcGetEventsResponse = await response.json()

  if (json.error) {
    throw new Error(`RPC error ${json.error.code}: ${json.error.message}`)
  }

  const count = json.result?.events.length ?? 0

  // Warn when a well-formed filter returns zero results — could be an encoding
  // issue or a node that has pruned all history.
  if (count === 0) {
    console.warn(
      `[useContractStats] No "${topicSymbol}" events returned by RPC. ` +
        'This may indicate the node has pruned history or the topic filter is wrong.',
    )
  }

  return count
}

// ── Hook ──────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 60_000 // re-fetch every 60 s

/**
 * Polls on-chain contract events to derive live statistics.
 *
 * Design decisions:
 *
 * 1. **No fabricated metrics** (#91): Stats are derived entirely from RPC
 *    event counts.  There is no hardcoded multiplier or synthetic TVL
 *    calculation.  If the real value cannot be fetched, the stat is null.
 *
 * 2. **Runtime topic encoding** (#92): Topic XDR is encoded at runtime via
 *    stellar-sdk's `xdr.ScVal` so it stays in sync with SDK upgrades.
 *
 * 3. **Error visibility** (#93): Each fetch result is tracked independently.
 *    On transient failure the hook returns the last known-good data with
 *    `status: 'stale'` rather than zeroing everything out.  The first-ever
 *    failure returns `status: 'error'` with `stats: null` so the UI can
 *    show a clear "unavailable" state instead of misleading zeros.
 */
export function useContractStats(): UseContractStatsResult {
  const [stats, setStats] = useState<ContractStats | null>(null)
  const [status, setStatus] = useState<StatsStatus>('loading')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Keep latest stats in a ref so the poll callback can read them without a
  // stale closure.
  const statsRef = useRef<ContractStats | null>(null)

  const fetchStats = useCallback(async (signal: AbortSignal) => {
    try {
      // Fetch both event types in parallel; if either throws, propagate.
      const [agreements, milestonesLocked] = await Promise.all([
        fetchEventCount('created', signal),
        fetchEventCount('locked', signal),
      ])

      if (signal.aborted) return

      const next: ContractStats = { agreements, milestonesLocked }
      statsRef.current = next
      setStats(next)
      setStatus('ok')
      setLastUpdated(new Date().toISOString())
    } catch (err) {
      if (signal.aborted) return

      console.error('[useContractStats] Fetch failed:', err)

      // If we have stale data from a previous successful poll, keep it visible
      // and mark as stale.  If we have never succeeded, mark as error so the
      // UI can show a "unavailable" placeholder rather than zeros (#93).
      setStatus(statsRef.current !== null ? 'stale' : 'error')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    // Initial fetch
    fetchStats(controller.signal)

    // Polling interval
    const interval = setInterval(() => {
      fetchStats(controller.signal)
    }, POLL_INTERVAL_MS)

    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [fetchStats])

  return { stats, status, lastUpdated }
}
