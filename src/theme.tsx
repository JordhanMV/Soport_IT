import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { FluentProvider, webDarkTheme, webLightTheme } from '@fluentui/react-components'

type ThemeName = 'light' | 'dark'

interface ThemeContextValue {
  themeName: ThemeName
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): ThemeName {
  const saved = localStorage.getItem('inventario-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themeName, setThemeName] = useState<ThemeName>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = themeName
    localStorage.setItem('inventario-theme', themeName)
  }, [themeName])

  const value: ThemeContextValue = {
    themeName,
    toggleTheme: () => setThemeName((current) => current === 'light' ? 'dark' : 'light'),
  }

  return (
    <ThemeContext.Provider value={value}>
      <FluentProvider theme={themeName === 'dark' ? webDarkTheme : webLightTheme}>
        {children}
      </FluentProvider>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider.')
  return context
}
