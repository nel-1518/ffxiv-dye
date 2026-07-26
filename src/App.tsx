import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, theme as antTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useTheme, ThemeProvider } from './hooks/useTheme'
import { initSchemeGlobally } from './hooks/useScheme'
import { schemes } from './data/schemes'
import NavBar from './components/NavBar'
import HomePage from './components/home/HomePage'
import GamePage from './components/game/GamePage'
import ExtractPage from './components/extract/ExtractPage'
import './App.css'
import './styles/home.css'
import './styles/game.css'
import './styles/navbar.css'
import './styles/extract.css'

function AppContent() {
  const { mode, setMode, resolvedTheme } = useTheme()
  initSchemeGlobally(schemes, resolvedTheme)

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm:
          resolvedTheme === 'dark'
            ? antTheme.darkAlgorithm
            : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: resolvedTheme === 'dark' ? '#a24730' : '#CC6C5E',
        },
      }}
    >
      <NavBar mode={mode} resolvedTheme={resolvedTheme} onThemeChange={setMode} />
      <div className="page-content">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/grab" element={<ExtractPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </ConfigProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
