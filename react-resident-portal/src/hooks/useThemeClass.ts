import { useMemo } from 'react'

export function useThemeClass() {
  // Basic dark/light placeholder.
  // Existing project already uses CSS variables; Tailwind dark mode can be extended later.
  return useMemo(() => {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
    return prefersDark ? 'dark' : ''
  }, [])
}

