import { useContractStats } from '../hooks/useContractStats'

/**
 * Small warning icon with a tooltip used when showing stale stats.
 */
function StaleIcon({ lastUpdated }: { lastUpdated: string | null }) {
  const label = lastUpdated
    ? `Live data unavailable — showing stats from ${new Date(lastUpdated).toLocaleTimeString()}`
    : 'Live data unavailable — showing last known stats'

  return (
    <span
      title={label}
      aria-label={label}
      role="img"
      className="inline-flex items-center ml-1 text-yellow-400 cursor-help"
    >
      {/* Simple triangle-exclamation rendered as SVG to avoid icon dependency */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-3.5 h-3.5"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  )
}

interface StatItemProps {
  label: string
  value: string | number | null
  unavailable?: boolean
  stale?: boolean
  lastUpdated?: string | null
}

function StatItem({ label, value, unavailable, stale, lastUpdated }: StatItemProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <span
        className={[
          'text-lg font-semibold',
          unavailable ? 'text-gray-500 italic' : 'text-cyan-400',
        ].join(' ')}
      >
        {unavailable ? (
          <span
            title="RPC data is currently unavailable"
            aria-label={`${label}: RPC data unavailable`}
          >
            N/A
          </span>
        ) : (
          <>
            {value}
            {stale && <StaleIcon lastUpdated={lastUpdated ?? null} />}
          </>
        )}
      </span>
    </div>
  )
}

/**
 * Horizontal stats bar shown on the home page.
 *
 * Error states (fix for #91 / #93):
 *  - `loading`  → skeleton placeholder
 *  - `ok`       → live counts from RPC
 *  - `stale`    → last known counts with a ⚠ tooltip
 *  - `error`    → "RPC Unavailable" banner; all values show N/A
 *
 * No fabricated metrics: there is no hardcoded TVL multiplier.  The
 * component shows only data that comes directly from on-chain events.
 */
export function StatsBar() {
  const { stats, status, lastUpdated } = useContractStats()

  if (status === 'loading') {
    return (
      <div
        className="flex justify-center gap-8 py-4 text-sm text-gray-500"
        aria-label="Loading stats"
        aria-busy="true"
      >
        <div className="h-10 w-24 rounded bg-navy-700/50 animate-pulse" />
        <div className="h-10 w-24 rounded bg-navy-700/50 animate-pulse" />
      </div>
    )
  }

  const isError = status === 'error'
  const isStale = status === 'stale'

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      {isError && (
        <p
          role="alert"
          className="text-xs text-red-400 flex items-center gap-1.5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5 flex-shrink-0"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
          RPC Unavailable — live stats could not be fetched
        </p>
      )}

      <div
        className="flex flex-wrap justify-center gap-8 py-3 px-6 rounded-xl border border-navy-700/60 bg-navy-800/30 backdrop-blur-sm"
        aria-label="Contract statistics"
      >
        <StatItem
          label="Agreements created"
          value={stats?.agreements ?? null}
          unavailable={isError}
          stale={isStale}
          lastUpdated={lastUpdated}
        />
        <StatItem
          label="Milestones funded"
          value={stats?.milestonesLocked ?? null}
          unavailable={isError}
          stale={isStale}
          lastUpdated={lastUpdated}
        />
      </div>
    </div>
  )
}
