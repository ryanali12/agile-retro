import type { ComponentType } from 'react'
import { useTheme, type ThemePreference } from '../theme'
import { cn } from '../utils/cn'

type IconProps = {
  className?: string
}

function SystemIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="3.5" width="19" height="13" rx="2" />
      <path d="M8 20.5h8M12 16.5v4" />
    </svg>
  )
}

function SunIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function MoonIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
    </svg>
  )
}

const options: {
  value: ThemePreference
  label: string
  Icon: ComponentType<IconProps>
}[] = [
  { value: 'system', label: 'System', Icon: SystemIcon },
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
]

/**
 * Three-way theme switch. System is the default and keeps following the OS;
 * Light and Dark pin the theme for this browser.
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme()

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="flex items-center gap-0.5 rounded-lg border border-border bg-surface-muted p-0.5"
    >
      {options.map(({ value, label, Icon }) => {
        const active = preference === value

        return (
          <button
            key={value}
            type="button"
            onClick={() => setPreference(value)}
            aria-pressed={active}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            className={cn(
              'inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors',
              active
                ? 'bg-surface text-text shadow-sm'
                : 'text-muted hover:text-text',
            )}
          >
            <Icon className="size-3.5" />
            <span className="hidden md:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
