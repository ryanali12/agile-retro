import type { InputHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text',
        'placeholder:text-muted/70 transition-colors',
        'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/30',
        className,
      )}
      {...props}
    />
  )
}
