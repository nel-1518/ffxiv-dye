/* ===== 色彩空间转换工具（纯函数） ===== */

import type { HslColor, RgbPixel, LabPixel } from './types'
import { rgbToLab } from '../color'

/**
 * Linear → sRGB（钳位到 0-255）
 */
export function linearToSrgb(c: number): number {
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  return Math.round(Math.max(0, Math.min(1, s)) * 255)
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
