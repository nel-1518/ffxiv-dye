import { useEffect, useRef } from 'react'

const AUTOPLAY_KEY = 'ffxiv-dye-autoplay'

/**
 * 从 localStorage 读取自动轮播状态，首次访问默认 true
 */
export function getAutoPlayState(): boolean {
  try {
    const saved = localStorage.getItem(AUTOPLAY_KEY)
    if (saved !== null) {
      return saved === 'true'
    }
  } catch {
    // ignore
  }
  // 首次访问，默认开启自动轮播
  return true
}

/**
 * 将自动轮播状态写入 localStorage
 */
export function saveAutoPlayState(active: boolean): void {
  try {
    localStorage.setItem(AUTOPLAY_KEY, String(active))
  } catch {
    // ignore
  }
}

/**
 * 自动轮播 hook
 * @param switchNext 切换到下一配色方案
 * @param isActive   是否开启自动轮播
 * @param intervalMs 轮播间隔（毫秒）
 */
export function useAutoSwitch(
  switchNext: () => void,
  isActive: boolean,
  intervalMs: number = 4000,
) {
  // 用 ref 持有最新回调，避免闭包过期
  const switchNextRef = useRef(switchNext)
  switchNextRef.current = switchNext

  useEffect(() => {
    if (!isActive) return

    const id = setInterval(() => {
      switchNextRef.current()
    }, intervalMs)

    return () => {
      clearInterval(id)
    }
  }, [isActive, intervalMs])
}
