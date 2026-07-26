/* ===== 色彩空间转换工具（纯函数） ===== */

import type { HslColor, RgbPixel, LabPixel } from './types'

/**
 * sRGB → Linear
 */
export function srgbToLinear(c: number): number {
  c /= 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/**
 * Linear → sRGB（钳位到 0-255）
 */
export function linearToSrgb(c: number): number {
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  return Math.round(Math.max(0, Math.min(1, s)) * 255)
}

function rgbToXyz(r: number, g: number, b: number) {
  const rl = srgbToLinear(r)
  const gl = srgbToLinear(g)
  const bl = srgbToLinear(b)
  return {
    x: rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375,
    y: rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750,
    z: rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041,
  }
}

function xyzToLab(x: number, y: number, z: number) {
  const xn = 0.95047, yn = 1.00000, zn = 1.08883
  const delta = 6 / 29, delta3 = delta * delta * delta, factor = 1 / (3 * delta * delta)
  const f = (t: number) => t > delta3 ? Math.cbrt(t) : factor * t + 4 / 29
  return {
    l: 116 * f(y / yn) - 16,
    a: 500 * (f(x / xn) - f(y / yn)),
    b: 200 * (f(y / yn) - f(z / zn)),
  }
}

export function rgbToLab(r: number, g: number, b: number) {
  const { x, y, z } = rgbToXyz(r, g, b)
  return xyzToLab(x, y, z)
}

export function rgbToHsl(r: number, g: number, b: number): HslColor {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0').toUpperCase()).join('')
}

export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

/**
 * 从 Canvas ImageData 提取像素（含透明合成）
 */
export function extractPixelsFromImage(
  img: HTMLImageElement,
  maxPixels = 40000,
): RgbPixel[] {
  const total = img.width * img.height
  let scale = 1
  if (total > maxPixels) scale = Math.sqrt(maxPixels / total)
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, w, h)
  const imgData = ctx.getImageData(0, 0, w, h).data
  const pixels: RgbPixel[] = []
  for (let i = 0; i < imgData.length; i += 4) {
    const r = imgData[i], g = imgData[i + 1], b = imgData[i + 2], a = imgData[i + 3]
    if (a < 10) continue
    if (a < 255) {
      const alpha = a / 255
      pixels.push({
        r: Math.round(r * alpha + 255 * (1 - alpha)),
        g: Math.round(g * alpha + 255 * (1 - alpha)),
        b: Math.round(b * alpha + 255 * (1 - alpha)),
      })
    } else {
      pixels.push({ r, g, b })
    }
  }
  return pixels
}

/**
 * RGB 像素 → LAB 像素数组
 */
export function pixelsToLab(pixels: RgbPixel[]): LabPixel[] {
  return pixels.map(p => {
    const lab = rgbToLab(p.r, p.g, p.b)
    return { l: lab.l, a: lab.a, b: p.b, r: p.r, g: p.g }
  })
}
