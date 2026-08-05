import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, theme as antTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useTheme, ThemeProvider } from './hooks/useTheme'
import { initSchemeGlobally, getSavedIndex } from './hooks/useScheme'
import { schemes } from './data/schemes'
import NavBar from './components/NavBar'
import HomePage from './components/home/HomePage'
import GamePage from './components/game/GamePage'
import ExtractPage from './components/extract/ExtractPage'
import SchemePage from './components/scheme/SchemePage'
import './App.css'
import './styles/home.css'
import './styles/game.css'
import './styles/navbar.css'
import './styles/extract.css'
import './styles/scheme.css'

function getSchemePrimary(resolvedTheme: 'light' | 'dark'): string {
  const idx = getSavedIndex(schemes.length)
  const scheme = schemes[idx]
  return resolvedTheme === 'dark' ? scheme.dark.primary : scheme.light.primary
}

function AppContent() {
  const { mode, setMode, resolvedTheme } = useTheme()
  initSchemeGlobally(schemes, resolvedTheme)

  const [primaryColor, setPrimaryColor] = useState(() => getSchemePrimary(resolvedTheme))

  useEffect(() => {
    const updatePrimary = () => setPrimaryColor(getSchemePrimary(resolvedTheme))
    updatePrimary()
    window.addEventListener('ffxiv-scheme-change', updatePrimary)
    return () => window.removeEventListener('ffxiv-scheme-change', updatePrimary)
  }, [resolvedTheme])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm:
          resolvedTheme === 'dark'
            ? antTheme.darkAlgorithm
            : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: primaryColor,
        },
      }}
    >
      <NavBar mode={mode} resolvedTheme={resolvedTheme} onThemeChange={setMode} />
      <div className="page-content">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/grab" element={<ExtractPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/scheme" element={<SchemePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </ConfigProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      {/* HashRouter：部署到 GitHub Pages 子路径时可避免刷新/深链 404 */}
      <HashRouter>
        <AppContent />
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
