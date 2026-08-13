import { useCallback, useEffect, useState } from 'react'
import type { Scheme } from '../types/scheme'
import type { ResolvedTheme } from './useTheme'

const TRANSITION_SPEED = '0.55s'
const STORAGE_KEY = 'ffxiv-dye-scheme'

/**
 * 从 localStorage 读取上次保存的方案索引，若无则随机
 */
export function getSavedIndex(length: number): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      const idx = parseInt(saved, 10)
      if (!isNaN(idx) && idx >= 0 && idx < length) return idx
    }
  } catch {
    // ignore
  }
  return Math.floor(Math.random() * length)
}

/**
 * 将 scheme 的色值写入 document.documentElement.style
 */
function applySchemeToDOM(scheme: Scheme, resolved: ResolvedTheme) {
  const colors = resolved === 'dark' ? scheme.dark : scheme.light
  const style = document.documentElement.style

  style.setProperty('--color-primary', colors.primary)
  style.setProperty('--color-bg', colors.bg)
  style.setProperty('--color-card', colors.card)
  style.setProperty('--color-text', colors.text)
  style.setProperty('--color-ring', colors.ring)
  style.setProperty('--transition-speed', TRANSITION_SPEED)

  scheme.diamonds.forEach((d, i) => {
    style.setProperty(`--color-d${i + 1}`, d.hex)
  })

  // 深色模式用 screen，浅色用 multiply
  style.setProperty('--blend-mode', resolved === 'dark' ? 'screen' : 'multiply')

  // 通知外部 scheme 已变更
  window.dispatchEvent(new CustomEvent('ffxiv-scheme-change'))
}

export function useScheme(schemes: Scheme[], resolvedTheme: ResolvedTheme) {
  const [currentIndex, setCurrentIndex] = useState(() => getSavedIndex(schemes.length))
  const currentScheme = schemes[currentIndex]

  const applyScheme = useCallback(
    (index: number) => {
      const newIndex = ((index % schemes.length) + schemes.length) % schemes.length
      setCurrentIndex(newIndex)
      try {
        localStorage.setItem(STORAGE_KEY, String(newIndex))
      } catch {
        // ignore
      }
      applySchemeToDOM(schemes[newIndex], resolvedTheme)
    },
    [schemes, resolvedTheme],
  )

  const switchNext = useCallback(() => {
    applyScheme(currentIndex + 1)
  }, [applyScheme, currentIndex])

  const switchTo = useCallback(
    (index: number) => {
      applyScheme(index)
    },
    [applyScheme],
  )

  // 首次初始化 / 主题或方案变化时：写入 CSS 变量（渲染后执行，避免渲染期修改外部状态）
  useEffect(() => {
    applySchemeToDOM(currentScheme, resolvedTheme)
  }, [currentScheme, resolvedTheme])

  return {
    currentScheme,
    currentIndex,
    switchNext,
    switchTo,
  }
}

/**
 * 重新应用当前方案的 CSS 变量（主题切换时调用）
 */
export function reapplyScheme(scheme: Scheme, resolvedTheme: ResolvedTheme) {
  applySchemeToDOM(scheme, resolvedTheme)
}

/**
 * 全局初始化/更新配色方案 CSS 变量
 * 每次渲染调用，resolvedTheme 变化时自动重应用颜色
 */
let _lastResolvedTheme: ResolvedTheme | null = null

export function initSchemeGlobally(schemes: Scheme[], resolvedTheme: ResolvedTheme) {
  if (typeof window === 'undefined') return
  if (_lastResolvedTheme === resolvedTheme) return

  const idx = getSavedIndex(schemes.length)
  applySchemeToDOM(schemes[idx], resolvedTheme)
  _lastResolvedTheme = resolvedTheme
}
