import type { SVGProps } from 'react'

/**
 * ScaleIcon — represents "Dispute Resolution" in the HowItWorks flow.
 * Extracted from HowItWorks.tsx to enable tree-shaking and browser caching (#95).
 */
export function ScaleIcon({
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
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M3 6l9-3 9 3" />
      <path d="M3 6l4.5 9a4.5 4.5 0 0 0 9 0L3 6" />
      <line x1="3" y1="21" x2="21" y2="21" />
    </svg>
  )
}

export default ScaleIcon
