/* ===== Color Thief v3 算法包装 ===== */

import { getPaletteSync } from 'colorthief'
import type { LabPixel, ExtractParams, ExtractResult, PaletteColor } from './types'

/**
 * 使用 Color Thief 的 getPaletteSync 从图片提取调色板
 * 参数: colorCount (2-20), quality (1-50)
 */
export function extractColors(
  _labPixels: LabPixel[],
  params: ExtractParams,
  image?: HTMLImageElement,
): ExtractResult {
  if (!image) {
    return { palette: [], initialClusters: 0, finalClusters: 0, mergedCount: 0, finalThreshold: 0 }
  }

  const colorCount = Math.max(0, Math.min(20, Math.round(params.targetCount || 8)))
  const effectiveColorCount = colorCount || 10 // 0 → 库默认值 10
  const colors = getPaletteSync(image, {
    colorCount: effectiveColorCount,
    quality: params.quality || 10,
    gamut: 'auto',
  })

  if (!colors || colors.length === 0) {
    return { palette: [], initialClusters: 0, finalClusters: 0, mergedCount: 0, finalThreshold: 0 }
  }

  const total = colors.reduce((s, c) => s + c.population, 0) || 1
  const palette: PaletteColor[] = colors.map(c => {
    const rgb = c.rgb()
    const hsl = c.hsl()
    return {
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      hex: c.hex(),
      hsl: { h: hsl.h, s: hsl.s, l: hsl.l },
      percentage: (c.population / total) * 100,
      count: c.population,
    }
  })

  palette.sort((a, b) => b.percentage - a.percentage)

  return {
    palette,
    initialClusters: palette.length,
    finalClusters: palette.length,
    mergedCount: 0,
    finalThreshold: 0,
  }
}

export const algorithmMeta = {
  key: 'colorthief',
  name: 'MMCQ（稳定）',
  description: 'Color Thief v3 — 中值切分量化',
} as const
