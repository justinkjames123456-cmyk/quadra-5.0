import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { dark, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      type="button"
      className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        color: 'var(--text)',
      }}
    >
      {dark ? 'Switch to Light' : 'Switch to Dark'}
    </button>
  )
}
