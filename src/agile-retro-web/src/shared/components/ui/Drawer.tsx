import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { cn } from '../../utils/cn'

export interface DrawerProps {
  title?: string
  subTitle?: string
  overlayClassName?: string
  drawerClassName?: string
  headerClassName?: string
  contentClassName?: string
  children?: ReactNode
  isOpen: boolean
  close?: () => void
  position?: 'left' | 'right'
  closeOnClickOverlay?: boolean
}

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Slide-over panel used instead of a modal for forms and detail views.
 *
 * Handles Escape, overlay click, body scroll locking, focus trapping and focus
 * restoration. The panel stays mounted so open/close transitions animate.
 */
export function Drawer({
  overlayClassName,
  drawerClassName,
  headerClassName,
  title,
  subTitle,
  contentClassName,
  children,
  isOpen,
  close,
  position = 'right',
  closeOnClickOverlay = true,
}: DrawerProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(close)

  useEffect(() => {
    closeRef.current = close
  }, [close])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const panel = panelRef.current
    const previouslyFocused = document.activeElement as HTMLElement | null
    const originalOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    panel?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeRef.current?.()
        return
      }

      if (event.key !== 'Tab' || !panel) {
        return
      }

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => element.offsetParent !== null)

      if (focusable.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
      previouslyFocused?.focus()
    }
  }, [isOpen])

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeRef.current?.()
    }
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-overlay transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        overlayClassName,
      )}
      aria-hidden={!isOpen}
      inert={!isOpen}
      onClick={closeOnClickOverlay ? handleOverlayClick : undefined}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : 'Panel'}
        tabIndex={-1}
        className={cn(
          'absolute top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-2xl outline-none',
          'transition-transform duration-300 ease-out',
          position === 'right' ? 'right-0' : 'left-0',
          isOpen
            ? 'translate-x-0'
            : position === 'right'
              ? 'translate-x-full'
              : '-translate-x-full',
          drawerClassName,
        )}
      >
        <div
          className={cn(
            'flex items-start justify-between gap-4 border-b border-border px-5 py-4',
            headerClassName,
          )}
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            {title ? (
              <h2
                id={titleId}
                className="truncate text-lg font-semibold text-text"
              >
                {title}
              </h2>
            ) : null}
            {subTitle ? (
              <p className="text-sm text-muted">{subTitle}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => closeRef.current?.()}
            aria-label="Close panel"
            className={cn(
              'grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors',
              'hover:bg-surface-muted hover:text-text',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            )}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              className="size-4"
              aria-hidden="true"
            >
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div
          className={cn('flex-1 overflow-y-auto px-5 py-4', contentClassName)}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
