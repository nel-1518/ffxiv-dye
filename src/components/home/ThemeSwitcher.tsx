import { useState, useRef, useEffect, type ReactNode } from 'react'
import { SyncOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons'
import type { ThemeMode, ResolvedTheme } from '../../hooks/useTheme'

interface ThemeSwitcherProps {
  mode: ThemeMode
  resolvedTheme: ResolvedTheme
  onChange: (mode: ThemeMode) => void
}

const options: { label: string; value: ThemeMode; icon: ReactNode }[] = [
  { label: '跟随系统', value: 'system', icon: <SyncOutlined /> },
  { label: '浅色', value: 'light', icon: <SunOutlined /> },
  { label: '深色', value: 'dark', icon: <MoonOutlined /> },
]

const iconMap: Record<ResolvedTheme, ReactNode> = {
  dark: <MoonOutlined />,
  light: <SunOutlined />,
}

function ThemeSwitcher({ mode, resolvedTheme, onChange }: ThemeSwitcherProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="theme-switcher" ref={ref}>
      <button
        className="theme-switcher-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="切换主题"
        title="切换主题"
      >
        {iconMap[resolvedTheme]}
      </button>
      {open && (
        <div className="theme-switcher-dropdown">
          {options.map((opt) => (
            <button
              key={opt.value}
              className={`theme-switcher-option${mode === opt.value ? ' active' : ''}`}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
            >
              <span className="theme-switcher-option-icon">{opt.icon}</span>
              <span>{opt.label}</span>
              {mode === opt.value && <span className="theme-switcher-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ThemeSwitcher
