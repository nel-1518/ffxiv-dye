/* ===== 染剂 LAB 预计算 + 最近邻匹配 ===== */

import dyeData from '../../data/colors.json'
import type { PaletteColor } from '../../utils/algorithms/types'

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

/* ---------- 工具：hex → RGB → LAB ---------- */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function srgbToLinear(c: number): number {
  c /= 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
  const rl = srgbToLinear(r)
  const gl = srgbToLinear(g)
  const bl = srgbToLinear(b)
  const x = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375
  const y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750
  const z = rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041
  const xn = 0.95047, yn = 1.00000, zn = 1.08883
  const delta = 6 / 29, delta3 = delta * delta * delta
  const factor = 1 / (3 * delta * delta)
  const f = (t: number) => t > delta3 ? Math.cbrt(t) : factor * t + 4 / 29
  return {
    l: 116 * f(y / yn) - 16,
    a: 500 * (f(x / xn) - f(y / yn)),
    b: 200 * (f(y / yn) - f(z / zn)),
  }
}

function cie76(l1: number, a1: number, b1: number, l2: number, a2: number, b2: number): number {
  const dl = l1 - l2, da = a1 - a2, db = b1 - b2
  return Math.sqrt(dl * dl + da * da + db * db)
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
      const dist = cie76(lab.l, lab.a, lab.b, dye.lab.l, dye.lab.a, dye.lab.b)
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
