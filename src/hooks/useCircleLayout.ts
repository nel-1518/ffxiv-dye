import { useCallback, useState } from 'react'
import type { CircleLayout } from '../types/scheme'

/**
 * 生成 5 个圆形的随机布局
 */
function generateCircleLayout(): CircleLayout[] {
  const cx = 50
  const cy = 50
  const circles: CircleLayout[] = []

  // 圆形 0 - 中心偏上的大圆
  const c0Angle = Math.random() * Math.PI * 2
  const c0Dist = 4 + Math.random() * 9
  circles.push({
    x: cx + Math.cos(c0Angle) * c0Dist,
    y: cy + Math.sin(c0Angle) * c0Dist,
    d: 54 + Math.random() * 10,
  })

  // 圆形 1-4 - 围绕中心分布
  const baseAngles = [0, Math.PI * 0.48, Math.PI * 0.95, Math.PI * 1.55]
  const angleJitter = (Math.random() - 0.5) * 2.45

  for (let i = 0; i < 4; i++) {
    const angle = baseAngles[i] + angleJitter + Math.random() * 0.30
    const dist = 18 + Math.random() * 14
    const d = 36 + Math.random() * 18
    circles.push({ x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist, d })
  }

  // 边界 clamp
  const clampX = (v: number) => Math.max(-6, Math.min(106, v))
  const clampY = (v: number) => Math.max(-6, Math.min(106, v))
  circles.forEach((c) => {
    c.x = clampX(c.x)
    c.y = clampY(c.y)
    c.d = Math.max(22, Math.min(66, c.d))
  })

  return circles
}

export function useCircleLayout() {
  const [layout, setLayout] = useState<CircleLayout[]>(generateCircleLayout)

  const regenerate = useCallback(() => {
    setLayout(generateCircleLayout())
  }, [])

  return { layout, regenerate }
}
