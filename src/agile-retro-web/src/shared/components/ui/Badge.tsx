import type { HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-muted text-muted',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({
  className,
  variant = 'neutral',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
