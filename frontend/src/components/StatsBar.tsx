/**
 * StatsBar — displays the last-updated timestamp for a live data panel.
 *
 * Issue #101: toLocaleTimeString() without a locale argument produces different
 * output across browser locales (e.g. '2:30:45 PM' in en-US vs '14:30:45' in
 * de-DE). This makes timestamps incomparable in screenshots or team discussions.
 *
 * Fix: always pass 'en-US' with { hour12: false } to get a consistent 24-hour
 * HH:MM:SS format regardless of the user's locale. Additionally:
 *  - If the last update was on a different calendar day, the date is prepended
 *    (YYYY-MM-DD) so the timestamp is unambiguous.
 *  - A title attribute carries the full ISO 8601 string for copy-paste precision.
 */

interface StatsBarProps {
  /** The timestamp of the last data refresh. */
  lastUpdated: Date
  /** Optional label shown before the timestamp. Defaults to "Last updated". */
  label?: string
}

/**
 * Formats a Date as HH:MM:SS in 24-hour time, locale-independently.
 *
 * If `date` falls on a different calendar day than `now`, the ISO date portion
 * (YYYY-MM-DD) is prepended so the displayed value is unambiguous.
 */
export function formatTimestamp(date: Date, now: Date = new Date()): string {
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  // Compare calendar dates in UTC to avoid timezone-crossing false positives
  // when the user's local clock is near midnight.
  const dateDay = date.toISOString().slice(0, 10)   // YYYY-MM-DD
  const nowDay  = now.toISOString().slice(0, 10)

  if (dateDay !== nowDay) {
    return `${dateDay} ${time}`
  }

  return time
}

export default function StatsBar({ lastUpdated, label = 'Last updated' }: StatsBarProps) {
  const displayTime = formatTimestamp(lastUpdated)
  const isoTime     = lastUpdated.toISOString()

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400">
      <span>{label}:</span>
      {/*
       * title carries the full ISO 8601 string (e.g. 2026-07-27T14:56:35.988Z)
       * for users who need sub-second precision or timezone context.
       */}
      <time dateTime={isoTime} title={isoTime} className="font-mono text-gray-300">
        {displayTime}
      </time>
    </div>
  )
}
