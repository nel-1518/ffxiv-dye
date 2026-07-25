import { useCallback, useEffect, useMemo } from 'react'
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

function HomePage() {
  const navigate = useNavigate()
  const { resolvedTheme } = useTheme()
  const { currentScheme, currentIndex, switchNext, switchTo } = useScheme(schemes, resolvedTheme)

  // 构建 hex → dye 查询表
  const dyeMap = useMemo(() => {
    const map: Record<string, string> = {}
    ;(colorData as Color[]).forEach((c) => {
      map[c.color] = c.dye
    })
    return map
  }, [])

  // 打开 wiki 页面
  const handleOpenWiki = useCallback((dye: string) => {
    window.open(`https://ff14.huijiwiki.com/wiki/物品:${encodeURIComponent(dye)}`, '_blank')
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
        <div className="home-card">
          <LogoBadge diamonds={currentScheme.diamonds} onSwitch={switchNext} />

          <div className="brand-name">染剂整理</div>
          <div className="brand-tagline">色彩斑斓的世界</div>

          <div className="divider" />

          <ColorStrip diamonds={currentScheme.diamonds} dyeMap={dyeMap} onOpenWiki={handleOpenWiki} />

          <button className="nav-btn" onClick={() => navigate('/game')}>
            小游戏 · 猜颜色
          </button>
        </div>
      </div>
    </>
  )
}

export default HomePage
