import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import colorData from '../../data/colors.json'
import type { Color } from '../../types/color'
import { schemes } from '../../data/schemes'
import { useTheme } from '../../hooks/useTheme'
import { useScheme, reapplyScheme } from '../../hooks/useScheme'
import { useKeyboardNav } from '../../hooks/useKeyboardNav'
import { useTouchSwipe } from '../../hooks/useTouchSwipe'
import LogoBadge from './LogoBadge'
import ColorStrip from './ColorStrip'
import { PauseOutlined, CaretRightOutlined } from '@ant-design/icons'
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

  // 构建 hex → dye 查询表
  const dyeMap = useMemo(() => {
    const map: Record<string, string> = {}
    ;(colorData as Color[]).forEach((c) => {
      map[c.color] = c.dye
    })
    return map
  }, [])

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

          <ColorStrip diamonds={currentScheme.diamonds} dyeMap={dyeMap} />

          <button className="nav-btn" onClick={() => navigate('/grab')}>
            图片颜色提取
          </button>

          <button className="nav-btn" onClick={() => navigate('/game')}>
            猜染剂小游戏
          </button>
        </div>
      </div>
    </>
  )
}

export default HomePage
