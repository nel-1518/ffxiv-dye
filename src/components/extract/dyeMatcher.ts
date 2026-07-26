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

/* ---------- CIEDE2000 色差公式 ---------- */

function degToRad(deg: number): number { return deg * Math.PI / 180 }
function radToDeg(rad: number): number { return rad * 180 / Math.PI }

/**
 * CIEDE2000 ΔE*₀₀
 * 参考: https://en.wikipedia.org/wiki/Color_difference#CIEDE2000
 */
function ciede2000(
  l1: number, a1: number, b1: number,
  l2: number, a2: number, b2: number,
): number {
  const kL = 1, kC = 1, kH = 1

  const c1 = Math.sqrt(a1 * a1 + b1 * b1)
  const c2 = Math.sqrt(a2 * a2 + b2 * b2)
  const cBar = (c1 + c2) / 2
  const cBar7 = cBar ** 7
  const G = 0.5 * (1 - Math.sqrt(cBar7 / (cBar7 + 25 ** 7)))

  const a1p = a1 * (1 + G)
  const a2p = a2 * (1 + G)
  const cp1 = Math.sqrt(a1p * a1p + b1 * b1)
  const cp2 = Math.sqrt(a2p * a2p + b2 * b2)

  const hp1 = radToDeg(Math.atan2(b1, a1p)) % 360
  const hp2 = radToDeg(Math.atan2(b2, a2p)) % 360
  const h1 = hp1 < 0 ? hp1 + 360 : hp1
  const h2 = hp2 < 0 ? hp2 + 360 : hp2

  const dLp = l2 - l1
  const dCp = cp2 - cp1
  let dHp: number
  const dh = h2 - h1
  if (cp1 === 0 || cp2 === 0) {
    dHp = 0
  } else if (Math.abs(dh) <= 180) {
    dHp = dh
  } else if (dh > 180) {
    dHp = dh - 360
  } else {
    dHp = dh + 360
  }
  const dHpRad = degToRad(dHp)
  const dH = 2 * Math.sqrt(cp1 * cp2) * Math.sin(dHpRad / 2)

  const cBarP = (cp1 + cp2) / 2
  const cBarP7 = cBarP ** 7
  const hBar = (Math.abs(h1 - h2) > 180) ? (h1 + h2 + 360) / 2 : (h1 + h2) / 2

  const T = 1
    - 0.17 * Math.cos(degToRad(hBar - 30))
    + 0.24 * Math.cos(degToRad(2 * hBar))
    + 0.32 * Math.cos(degToRad(3 * hBar + 6))
    - 0.20 * Math.cos(degToRad(4 * hBar - 63))

  const SL = 1 + 0.015 * ((l1 + l2) / 2 - 50) ** 2 / Math.sqrt(20 + ((l1 + l2) / 2 - 50) ** 2)
  const SC = 1 + 0.045 * cBarP
  const SH = 1 + 0.015 * cBarP * T

  const dhBar = (hBar - 275) / 25
  const dTheta = 30 * Math.exp(-(dhBar * dhBar))
  const RC = 2 * Math.sqrt(cBarP7 / (cBarP7 + 25 ** 7))
  const RT = -RC * Math.sin(degToRad(2 * dTheta))

  return Math.sqrt(
    (dLp / (kL * SL)) ** 2
    + (dCp / (kC * SC)) ** 2
    + (dH / (kH * SH)) ** 2
    + RT * (dCp / (kC * SC)) * (dH / (kH * SH))
  )
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
