import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea({ className, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text',
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
