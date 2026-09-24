import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 mono text-xs uppercase tracking-[0.2em] text-[#6B6560] transition-colors hover:text-[#F0EAD6]"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <>
          <Sun size={15} /> <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon size={15} /> <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  )
}