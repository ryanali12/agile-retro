import type { HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface p-5 shadow-sm',
        className,
      )}
      {...props}
    />
  )
}
