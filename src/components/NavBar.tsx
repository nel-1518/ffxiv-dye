import { useLocation, useNavigate } from 'react-router-dom'
import type { ThemeMode, ResolvedTheme } from '../hooks/useTheme'
import ThemeSwitcher from './home/ThemeSwitcher'

interface NavBarProps {
  mode: ThemeMode
  resolvedTheme: ResolvedTheme
  onThemeChange: (mode: ThemeMode) => void
}

const links = [
  { path: '/', label: '主页' },
  { path: '/grab', label: '色彩提取' },
  { path: '/scheme', label: '配色推荐' },
  { path: '/game', label: '小游戏' },
]

function NavBar({ mode, resolvedTheme, onThemeChange }: NavBarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="nav-bar">
      <div className="nav-bar-inner">
        <div className="nav-bar-links">
          {links.map((link) => (
            <a
              key={link.path}
              className={`nav-link${location.pathname === link.path ? ' active' : ''}`}
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="nav-bar-right">
          <ThemeSwitcher mode={mode} resolvedTheme={resolvedTheme} onChange={onThemeChange} />
        </div>
      </div>
    </nav>
  )
}

export default NavBar
