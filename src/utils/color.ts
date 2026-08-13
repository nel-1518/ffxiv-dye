/* ===== 颜色工具（纯函数，全站统一） =====
 * 集中维护色彩空间转换、相对亮度、对比度与色差计算，
 * 整合自 schemeAlgorithm.ts / dyeMatcher.ts / colorSpace.ts，
 * 避免各模块重复实现。
 */

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

/* ---------- hex → RGB ---------- */

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

/* ---------- sRGB → Linear ---------- */

export function srgbToLinear(c: number): number {
  c /= 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/* ---------- RGB → HSL ---------- */

export function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2

  if (max === min) return { h: 0, s: 0, l }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case rn:
      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
      break
    case gn:
      h = ((bn - rn) / d + 2) / 6
      break
    case bn:
      h = ((rn - gn) / d + 4) / 6
      break
  }

  return { h: h * 360, s, l }
}

/* ---------- 相对亮度 (WCAG) ---------- */

/** 相对亮度（hex 版本） */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

/** 相对亮度（RGB 通道版本） */
export function rgbRelativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

/* ---------- 对比度 (WCAG) ---------- */

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1)
  const l2 = relativeLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/* ---------- 色相差值 (环形) ---------- */

export function hueDiff(h1: number, h2: number): number {
  const d = Math.abs(h1 - h2)
  return Math.min(d, 360 - d)
}

/* ---------- RGB → LAB ---------- */

function rgbToXyz(r: number, g: number, b: number): { x: number; y: number; z: number } {
  const rl = srgbToLinear(r)
  const gl = srgbToLinear(g)
  const bl = srgbToLinear(b)
  return {
    x: rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375,
    y: rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750,
    z: rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041,
  }
}

function xyzToLab(x: number, y: number, z: number): Lab {
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

export function rgbToLab(r: number, g: number, b: number): Lab {
  const { x, y, z } = rgbToXyz(r, g, b)
  return xyzToLab(x, y, z)
}

/* ---------- CIEDE2000 色差公式 ---------- */

function degToRad(deg: number): number { return deg * Math.PI / 180 }
function radToDeg(rad: number): number { return rad * 180 / Math.PI }

/**
 * CIEDE2000 ΔE*₀₀
 * 参考: https://en.wikipedia.org/wiki/Color_difference#CIEDE2000
 */
export function ciede2000(
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
