import type { SVGProps } from 'react'

export function ChevronSmallLeftIcon({ size = 24, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeDasharray="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 12l5 -5M9 12l5 5"
      />
      <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="10;0" />
    </svg>
  )
}
