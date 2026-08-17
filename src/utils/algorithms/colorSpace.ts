/* ===== 色彩空间转换工具（纯函数） ===== */

import type { HslColor, RgbPixel, LabPixel } from './types'
import { rgbToLab } from '../color'
import { formatHex, hsl } from 'culori'

/**
 * Linear → sRGB（钳位到 0-255）
 */
export function linearToSrgb(c: number): number {
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  return Math.round(Math.max(0, Math.min(1, s)) * 255)
}

/** HslColor 为百分比语义（h/s/l 均为整数 0-100 或 h 0-360） */
export function rgbToHsl(r: number, g: number, b: number): HslColor {
  const c = hsl({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 })
  return { h: Math.round(c.h ?? 0), s: Math.round(c.s * 100), l: Math.round(c.l * 100) }
}

export function rgbToHex(r: number, g: number, b: number): string {
  return formatHex({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 }).toUpperCase()
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
    return { l: lab.l, a: lab.a, labB: lab.b, b: p.b, r: p.r, g: p.g }
  })
}
