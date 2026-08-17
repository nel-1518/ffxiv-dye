/* ===== 染剂 LAB 预计算 + 最近邻匹配 =====
 * lab 为 D65 CIELAB (lab65)，与 color.ts 的 rgbToLab / ciede2000 保持一致
 */

import dyeData from '../../data/colors.json'
import type { PaletteColor } from '../../utils/algorithms/types'
import { hexToRgb, rgbToLab, ciede2000 } from '../../utils/color'

/* ---------- 染剂类型 ---------- */

export interface DyeItem {
  hex: string
  name: string
  type: string
  dye: string
  lab: { l: number; a: number; b: number }
}

export interface DyeMatch {
  index: number
  extracted: PaletteColor
  dye: DyeItem
  deltaE: number
}

/* ---------- 模块级预计算 ---------- */

export const allDyes: DyeItem[] = (dyeData as { color: string; name: string; type: string; dye: string }[]).map(d => {
  const { r, g, b } = hexToRgb(d.color)
  const lab = rgbToLab(r, g, b)
  return { hex: d.color, name: d.name, type: d.type, dye: d.dye, lab }
})

/* ---------- 主匹配函数 ---------- */

export function findDyeMatches(palette: PaletteColor[]): DyeMatch[] {
  return palette.map((extracted, idx) => {
    const lab = rgbToLab(extracted.r, extracted.g, extracted.b)
    let best: DyeItem | null = null
    let bestDist = Infinity
    for (const dye of allDyes) {
      const dist = ciede2000(lab.l, lab.a, lab.b, dye.lab.l, dye.lab.a, dye.lab.b)
      if (dist < bestDist) { bestDist = dist; best = dye }
    }
    return {
      index: idx,
      extracted,
      dye: best!,
      deltaE: bestDist,
    }
  })
}
