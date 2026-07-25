import SkeletonBox from './SkeletonBox'

interface ButtonSkeletonProps {
  width?: string | number
  className?: string
}

/** Button-shaped skeleton — used while an action button resolves its auth state. */
function ButtonSkeleton({ width = '8rem', className = '' }: ButtonSkeletonProps) {
  return <SkeletonBox width={width} height="2.5rem" className={`rounded-lg ${className}`} />
}

export default ButtonSkeleton
