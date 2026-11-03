import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ThemeContext } from './themeContext'
import {
  applyTheme,
  getSystemTheme,
  readStoredTheme,
  storeTheme,
  type ResolvedTheme,
  type ThemePreference,
} from './theme'

/**
 * Owns the light / dark / system preference. The default is `system`, so the
 * app follows the operating system until the user explicitly overrides it.
 * The choice is persisted per browser.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] =
    useState<ThemePreference>(readStoredTheme)
  const [systemTheme, setSystemTheme] =
    useState<ResolvedTheme>(getSystemTheme)

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    applyTheme(preference)
    storeTheme(preference)
  }, [preference])

  const changePreference = useCallback((next: ThemePreference) => {
    setPreference(next)
  }, [])

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme: preference === 'system' ? systemTheme : preference,
      setPreference: changePreference,
    }),
    [preference, systemTheme, changePreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
