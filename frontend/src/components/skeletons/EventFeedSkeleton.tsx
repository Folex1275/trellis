import SkeletonBox from './SkeletonBox'

const ROWS = [0, 1, 2, 3, 4]

/** Placeholder for the event feed timeline — five rows. */
function EventFeedSkeleton() {
  return (
    <div role="status" aria-label="Loading events" className="space-y-4">
      {ROWS.map((row) => (
        <div key={row} className="flex items-start gap-4">
          {/* Timeline dot */}
          <SkeletonBox width="0.75rem" height="0.75rem" className="mt-1 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBox width="35%" height="1rem" />
            <SkeletonBox width="60%" height="0.875rem" />
          </div>
          {/* Timestamp */}
          <SkeletonBox width="4rem" height="0.875rem" className="shrink-0" />
        </div>
      ))}
    </div>
  )
}

export default EventFeedSkeleton
