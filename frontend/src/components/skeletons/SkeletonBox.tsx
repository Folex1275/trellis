interface SkeletonBoxProps {
  width?: string | number
  height?: string | number
  className?: string
}

/**
 * Generic rectangular skeleton placeholder with a shimmer sweep.
 * The shimmer gradient itself lives in index.css (.skeleton-shimmer).
 */
function SkeletonBox({ width, height, className = '' }: SkeletonBoxProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer rounded ${className}`}
      style={{ width, height }}
    />
  )
}

export default SkeletonBox
