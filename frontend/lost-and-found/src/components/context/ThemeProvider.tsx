import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'
type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to 'dark' based on design
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    // Check if user has a saved preference in localStorage
    const savedTheme = localStorage.getItem('findory_theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('findory_theme', nextTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

// Custom hook to use theme easily 
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}