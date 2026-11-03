import { createContext, useContext } from 'react'
import type { ResolvedTheme, ThemePreference } from './theme'

export interface ThemeContextValue {
  /** Stored choice: follow the system, or force light / dark. */
  preference: ThemePreference
  /** The theme actually in effect right now. */
  resolvedTheme: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }

  return context
}
