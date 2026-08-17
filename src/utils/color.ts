/* ===== 颜色工具（纯函数，全站统一） =====
 * 基于 culori (https://culorijs.org) 实现，保留原有导出签名，调用方零改动。
 * Lab 统一使用 D65 白点 (lab65)，与 culori 的 CIEDE2000 参考实现一致。
 * 手写的 RGB→XYZ→LAB、CIEDE2000、WCAG 亮度/对比度已由 culori 接管。
 */

import { differenceCiede2000, hsl, lab65, lch, lrgb, rgb, wcagContrast, wcagLuminance } from 'culori'

export interface Rgb {
  r: number
  g: number
  b: number
}

/** HSL：h 0-360，s/l 0-1 */
export interface Hsl {
  h: number
  s: number
  l: number
}

export interface Lab {
  l: number
  a: number
  b: number
}

export interface Lch {
  l: number
  c: number
  h: number
}

/* ---------- hex → RGB (0-255) ---------- */

export function hexToRgb(hex: string): Rgb {
  const c = rgb(hex)
  if (!c) return { r: 0, g: 0, b: 0 }
  return {
    r: Math.round(c.r * 255),
    g: Math.round(c.g * 255),
    b: Math.round(c.b * 255),
  }
}

/* ---------- sRGB → Linear ---------- */

export function srgbToLinear(c: number): number {
  return lrgb({ mode: 'rgb', r: c / 255, g: c / 255, b: c / 255 }).r
}

/* ---------- RGB → HSL ---------- */

/** 灰色时 culori 的 h 为 undefined，统一兜底为 0 */
export function rgbToHsl(r: number, g: number, b: number): Hsl {
  const c = hsl({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 })
  return { h: c.h ?? 0, s: c.s, l: c.l }
}

/* ---------- 相对亮度 (WCAG) ---------- */

/** 相对亮度（hex 版本） */
export function relativeLuminance(hex: string): number {
  return wcagLuminance(hex)
}

/** 相对亮度（RGB 通道版本，0-255） */
export function rgbRelativeLuminance(r: number, g: number, b: number): number {
  return wcagLuminance({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 })
}

/* ---------- 对比度 (WCAG) ---------- */

export function contrastRatio(hex1: string, hex2: string): number {
  return wcagContrast(hex1, hex2)
}

/* ---------- 色相差值 (环形) ---------- */

export function hueDiff(h1: number, h2: number): number {
  const d = Math.abs(h1 - h2)
  return Math.min(d, 360 - d)
}

/* ---------- RGB → LAB (D65) ---------- */

/**
 * RGB → CIELAB，D65 白点 (lab65)。
 * culori 的 CIEDE2000 色差在 lab65 空间运算，与本函数输出保持一致。
 */
export function rgbToLab(r: number, g: number, b: number): Lab {
  const c = lab65({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 })
  return { l: c.l, a: c.a, b: c.b }
}

/* ---------- RGB → LCH（感知均匀） ---------- */

/**
 * RGB → LCH（Culori 基于 D50 白点的 lch）。
 * LCH 是感知均匀的色彩空间：同样的色相差/明度差在所有色相区域看起来一致，
 * 参考 Codrops《Coloring With Code》(2021) 的配色方法。
 * 灰色时 culori 的 h 为 undefined，统一兜底为 0。
 */
export function rgbToLch(r: number, g: number, b: number): Lch {
  const c = lch({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 })
  return { l: c.l, c: c.c, h: c.h ?? 0 }
}

/* ---------- 带权 LCH 感知距离 ---------- */

/**
 * 带权 LCH 欧氏距离（感知均匀）。
 * 色相差按 CIE 标准 ΔH = 2√(C1·C2)·sin(Δh/2) 处理（环形、随彩度缩放），
 * 明度/彩度差直算。任一彩度为 0（灰色）时色相项自然退化为 0。
 * @param weights - 可选权重 { wL, wC, wH }，默认 { 1, 1, 1 }
 */
export function lchDistance(
  l1: number, c1: number, h1: number,
  l2: number, c2: number, h2: number,
  weights: { wL?: number; wC?: number; wH?: number } = {},
): number {
  const { wL = 1, wC = 1, wH = 1 } = weights
  const dL = l1 - l2
  const dC = c1 - c2
  const dH = 2 * Math.sqrt(Math.max(0, c1) * Math.max(0, c2)) * Math.sin((hueDiff(h1, h2) * Math.PI) / 360)
  return Math.sqrt(wL * dL * dL + wC * dC * dC + wH * dH * dH)
}

/* ---------- CIEDE2000 色差公式 ---------- */

const deltaE2000 = differenceCiede2000()

/**
 * CIEDE2000 ΔE*₀₀（culori 实现，与 Sharma 参考实现一致）
 * 参考: https://en.wikipedia.org/wiki/Color_difference#CIEDE2000
 */
export function ciede2000(
  l1: number, a1: number, b1: number,
  l2: number, a2: number, b2: number,
): number {
  return deltaE2000(
    { mode: 'lab65', l: l1, a: a1, b: b1 },
    { mode: 'lab65', l: l2, a: a2, b: b2 },
  )
}
