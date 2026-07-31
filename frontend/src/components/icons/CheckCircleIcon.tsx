import type { SVGProps } from 'react'

/**
 * CheckCircle icon — represents "Approve & Release" in the HowItWorks flow.
 * Extracted from HowItWorks.tsx to enable tree-shaking and browser caching (#95).
 */
export function CheckCircleIcon({
  size = 32,
  color = 'currentColor',
  className,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

export default CheckCircleIcon
