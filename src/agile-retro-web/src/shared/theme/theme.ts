export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

/**
 * Keep in sync with the inline bootstrap script in index.html, which applies
 * the stored theme before first paint to avoid a flash.
 */
export const THEME_STORAGE_KEY = 'agile-retro.theme'

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

export function readStoredTheme(): ThemePreference {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(value) ? value : 'system'
  } catch {
    // Storage can be unavailable (for example in private browsing).
    return 'system'
  }
}

export function applyTheme(preference: ThemePreference) {
  document.documentElement.dataset.theme = preference
}

export function storeTheme(preference: ThemePreference) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Persisting the choice is optional; the app still works without it.
  }
}

export function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}
