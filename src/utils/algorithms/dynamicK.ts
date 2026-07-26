/* ===== 直方图动态定 K ===== */

import type { RgbPixel } from './types'

/**
 * 基于颜色直方图粗分计算动态 K 值
 * - RGB 各压缩到 4 级 → 64 种粗分颜色
 * - 计数 > 像素总数 0.5% 视为有效色 M
 * - K = min(max(5, M * 2), 30)
 */
export function computeDynamicK(pixels: RgbPixel[]): { k: number; m: number } {
  const total = pixels.length
  if (total === 0) return { k: 5, m: 0 }

  const bins = new Uint32Array(64)
  for (let i = 0; i < total; i++) {
    const r4 = Math.min(3, Math.floor(pixels[i].r / 64))
    const g4 = Math.min(3, Math.floor(pixels[i].g / 64))
    const b4 = Math.min(3, Math.floor(pixels[i].b / 64))
    const idx = (r4 << 4) | (g4 << 2) | b4
    bins[idx]++
  }

  const threshold = total * 0.005
  let m = 0
  for (let i = 0; i < 64; i++) {
    if (bins[i] > threshold) m++
  }

  const k = Math.min(Math.max(5, m * 2), 30)
  return { k, m }
}
