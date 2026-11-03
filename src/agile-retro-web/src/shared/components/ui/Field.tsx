import { cloneElement, isValidElement, useId, type ReactElement } from 'react'
import { cn } from '../../utils/cn'

interface FieldControlProps {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

export interface FieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: ReactElement<FieldControlProps>
}

/**
 * Wraps a single form control with a label, optional hint and error message,
 * and wires up `id`, `aria-describedby` and `aria-invalid` for accessibility.
 */
export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  const generatedId = useId()
  const messageId = `${generatedId}-message`

  const message = error ?? hint
  const describedBy = [
    children.props['aria-describedby'],
    message ? messageId : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? generatedId,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : children.props['aria-invalid'],
      })
    : children

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={children.props.id ?? generatedId} className="text-sm font-medium text-text">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </label>
      {control}
      {message ? (
        <p
          id={messageId}
          className={cn('text-xs', error ? 'text-danger' : 'text-muted')}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
