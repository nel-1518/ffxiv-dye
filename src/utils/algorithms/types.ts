/* ===== 色彩提取算法共享类型 ===== */

export interface RgbPixel {
  r: number
  g: number
  b: number
}

export interface LabPixel {
  l: number
  a: number
  labB: number   // LAB b channel
  b: number      // RGB blue channel
  r: number
  g: number
}

export interface HslColor {
  h: number
  s: number
  l: number
}

export interface PaletteColor {
  r: number
  g: number
  b: number
  hex: string
  hsl: HslColor
  percentage: number
  count: number
}

export interface ExtractParams {
  initialK: number
  mergeThreshold: number
  targetCount: number
  filterExtreme: boolean
  enableMerge: boolean
  quality: number
}

export interface ExtractResult {
  palette: PaletteColor[]
  initialClusters: number
  finalClusters: number
  mergedCount: number
  finalThreshold: number
}

export interface AlgorithmMeta {
  key: string
  name: string
  description: string
}

export type AlgorithmFn = (
  labPixels: LabPixel[],
  params: ExtractParams,
  image?: HTMLImageElement,
) => ExtractResult
