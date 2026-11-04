import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
import { AlertTriangleIcon } from '../icons'
import { cn } from '../../utils/cn'
import { Button } from './Button'

export type ConfirmDialogTone = 'default' | 'danger'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  pendingLabel?: string
  tone?: ConfirmDialogTone
  isPending?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
  className?: string
}

/**
 * Compact confirmation dialog for short, high-consequence decisions.
 *
 * Uses the native `<dialog>` element so the browser owns the top layer, focus
 * trapping, focus restoration, and Escape handling. Forms and detail views
 * still use `Drawer`.
 */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  pendingLabel = 'Working...',
  tone = 'default',
  isPending = false,
  error,
  onConfirm,
  onCancel,
  className,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) return

    if (!isOpen) {
      if (dialog.open) dialog.close()

      return
    }

    const originalOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    if (!dialog.open) {
      dialog.showModal()
    }

    return () => {
      document.body.style.overflow = originalOverflow

      if (dialog.open) dialog.close()
    }
  }, [isOpen])

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget && !isPending) {
      onCancel()
    }
  }

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault()

    if (!isPending) {
      onCancel()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClick={handleBackdropClick}
      onCancel={handleCancel}
      className={cn(
        'm-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-surface p-0 text-text shadow-2xl',
        'backdrop:bg-overlay',
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          {tone === 'danger' ? (
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-danger/10 text-danger"
            >
              <AlertTriangleIcon className="size-4.5" />
            </span>
          ) : null}

          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={titleId} className="text-base font-semibold text-text">
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="text-sm leading-relaxed text-muted"
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
            autoFocus
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
