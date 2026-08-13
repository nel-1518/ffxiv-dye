import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { schemes } from '../../data/schemes'
import { useTheme } from '../../hooks/useTheme'
import { useScheme, reapplyScheme } from '../../hooks/useScheme'
import { useKeyboardNav } from '../../hooks/useKeyboardNav'
import { useTouchSwipe } from '../../hooks/useTouchSwipe'
import LogoBadge from './LogoBadge'
import ColorStrip from './ColorStrip'
import {
  PauseOutlined,
  CaretRightOutlined,
  PictureOutlined,
  BgColorsOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useAutoSwitch, getAutoPlayState, saveAutoPlayState } from '../../hooks/useAutoSwitch'

function HomePage() {
  const navigate = useNavigate()
  const { resolvedTheme } = useTheme()
  const { currentScheme, currentIndex, switchNext, switchTo } = useScheme(schemes, resolvedTheme)

  // 自动轮播状态
  const [isAutoPlaying, setIsAutoPlaying] = useState(() => getAutoPlayState())

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((prev) => {
      const next = !prev
      saveAutoPlayState(next)
      return next
    })
  }, [])

  // 自动轮播：每 3 秒切换一次配色
  useAutoSwitch(switchNext, isAutoPlaying)

  // 主题切换时重新应用当前方案的 CSS 变量
  useEffect(() => {
    reapplyScheme(currentScheme, resolvedTheme)
  }, [resolvedTheme, currentScheme])

  // 键盘导航
  const handlePrev = useCallback(() => {
    switchTo(currentIndex - 1)
  }, [switchTo, currentIndex])

  useKeyboardNav(switchNext, handlePrev, switchTo, schemes.length)
  useTouchSwipe(switchNext, handlePrev)

  return (
    <>
      <div className="main-container">
        <div className="home-card" data-autoplay={isAutoPlaying ? 'running' : 'paused'}>
          <LogoBadge diamonds={currentScheme.diamonds} onSwitch={switchNext} />

          <button
            className="autoplay-toggle"
            onClick={toggleAutoPlay}
            title={isAutoPlaying ? '暂停自动切换' : '开始自动切换'}
          >
            {isAutoPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
          </button>

          <div className="brand-name">染剂整理</div>
          <div className="brand-tagline">世界的斑斓色彩</div>

          <div className="divider" />

          <ColorStrip diamonds={currentScheme.diamonds} />

          <nav className="nav-grid">
            <button className="nav-card" onClick={() => navigate('/grab')}>
              <span className="nav-card-icon">
                <PictureOutlined />
              </span>
              <span className="nav-card-text">色彩提取</span>
            </button>

            <button className="nav-card" onClick={() => navigate('/scheme')}>
              <span className="nav-card-icon">
                <BgColorsOutlined />
              </span>
              <span className="nav-card-text">配色推荐</span>
            </button>

            <button className="nav-card" onClick={() => navigate('/game')}>
              <span className="nav-card-icon">
                <ThunderboltOutlined />
              </span>
              <span className="nav-card-text">小游戏</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  )
}

export default HomePage
