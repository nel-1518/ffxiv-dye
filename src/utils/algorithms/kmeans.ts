/* ===== K-Means++ 聚类 + LAB 空间合并算法 ===== */

import type { LabPixel, ExtractParams, ExtractResult, PaletteColor } from './types'
import { rgbToLab } from '../color'
import { rgbToHex, rgbToHsl } from './colorSpace'

/* ---------- RGB K-Means++ ---------- */

interface RgbCentroid { r: number; g: number; b: number }

function kmeansRgb(
  pixels: { r: number; g: number; b: number }[],
  k: number,
  maxIter = 50,
  threshold = 1.0,
): { centroids: RgbCentroid[]; labels: number[] } {
  const n = pixels.length
  if (n === 0) return { centroids: [], labels: [] }
  if (k >= n) {
    return {
      centroids: pixels.map(p => ({ r: p.r, g: p.g, b: p.b })),
      labels: Array.from({ length: n }, (_, i) => i),
    }
  }

  // K-Means++ 初始化
  const centroids: RgbCentroid[] = []
  const firstIdx = Math.floor(Math.random() * n)
  centroids.push({ r: pixels[firstIdx].r, g: pixels[firstIdx].g, b: pixels[firstIdx].b })
  for (let c = 1; c < k; c++) {
    const dists = new Float64Array(n)
    let total = 0
    for (let i = 0; i < n; i++) {
      let minD = Infinity
      for (const ct of centroids) {
        const dr = pixels[i].r - ct.r, dg = pixels[i].g - ct.g, db = pixels[i].b - ct.b
        const d = dr * dr + dg * dg + db * db
        if (d < minD) minD = d
      }
      dists[i] = minD
      total += minD
    }
    const r = Math.random() * total
    let idx = 0
    for (let cum = 0; idx < n; idx++) {
      cum += dists[idx]
      if (cum >= r) break
    }
    centroids.push({ r: pixels[idx].r, g: pixels[idx].g, b: pixels[idx].b })
  }

  const labels = new Int32Array(n)
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false
    for (let i = 0; i < n; i++) {
      let minD = Infinity, best = 0
      for (let j = 0; j < k; j++) {
        const dr = pixels[i].r - centroids[j].r
        const dg = pixels[i].g - centroids[j].g
        const db = pixels[i].b - centroids[j].b
        const d = dr * dr + dg * dg + db * db
        if (d < minD) { minD = d; best = j }
      }
      if (labels[i] !== best) { changed = true; labels[i] = best }
    }
    const sums = Array.from({ length: k }, () => ({ r: 0, g: 0, b: 0, count: 0 }))
    for (let i = 0; i < n; i++) {
      const cl = labels[i]
      sums[cl].r += pixels[i].r
      sums[cl].g += pixels[i].g
      sums[cl].b += pixels[i].b
      sums[cl].count++
    }
    let maxShift = 0
    for (let j = 0; j < k; j++) {
      if (sums[j].count > 0) {
        const nr = sums[j].r / sums[j].count
        const ng = sums[j].g / sums[j].count
        const nb = sums[j].b / sums[j].count
        const dr = nr - centroids[j].r
        const dg = ng - centroids[j].g
        const db = nb - centroids[j].b
        const shift = Math.sqrt(dr * dr + dg * dg + db * db)
        if (shift > maxShift) maxShift = shift
        centroids[j].r = nr; centroids[j].g = ng; centroids[j].b = nb
      } else {
        let farIdx = 0, farDist = -1
        for (let i = 0; i < n; i++) {
          let dsum = 0
          for (const ct of centroids) {
            const dr = pixels[i].r - ct.r, dg = pixels[i].g - ct.g, db = pixels[i].b - ct.b
            dsum += dr * dr + dg * dg + db * db
          }
          if (dsum > farDist) { farDist = dsum; farIdx = i }
        }
        centroids[j].r = pixels[farIdx].r
        centroids[j].g = pixels[farIdx].g
        centroids[j].b = pixels[farIdx].b
        maxShift = Infinity
      }
    }
    if (!changed || maxShift < threshold) break
  }

  return {
    centroids: centroids.map(c => ({
      r: Math.round(c.r),
      g: Math.round(c.g),
      b: Math.round(c.b),
    })),
    labels: Array.from(labels),
  }
}

/* ---------- LAB 空间合并 ---------- */

interface LabCentroid { l: number; a: number; labB: number }

function mergeCloseClusters(
  filteredPixels: LabPixel[],
  initialLabels: number[],
  initialCentroids: LabCentroid[],
  mergeThreshold: number,
): { labels: number[]; centroids: LabCentroid[]; mergedCount: number } {
  const k = initialCentroids.length
  if (k <= 1) return { labels: initialLabels, centroids: initialCentroids, mergedCount: 0 }

  const clusters: number[][] = Array.from({ length: k }, () => [])
  for (let i = 0; i < filteredPixels.length; i++) {
    clusters[initialLabels[i]].push(i)
  }

  const currentCentroids = initialCentroids.map(c => ({ l: c.l, a: c.a, labB: c.labB }))
  const activeClusters = new Array(k).fill(true)
  let merged = 0

  let mergedThisRound = true
  while (mergedThisRound) {
    mergedThisRound = false
    let minDist = Infinity
    let mergePair: [number, number] = [-1, -1]

    const activeIndices: number[] = []
    for (let i = 0; i < k; i++) if (activeClusters[i]) activeIndices.push(i)

    for (let a = 0; a < activeIndices.length; a++) {
      const i = activeIndices[a]
      for (let b = a + 1; b < activeIndices.length; b++) {
        const j = activeIndices[b]
        const dl = currentCentroids[i].l - currentCentroids[j].l
        const da = currentCentroids[i].a - currentCentroids[j].a
        const db = currentCentroids[i].labB - currentCentroids[j].labB
        const dist = Math.sqrt(dl * dl + da * da + db * db)
        if (dist < minDist) { minDist = dist; mergePair = [i, j] }
      }
    }

    if (minDist < mergeThreshold && mergePair[0] !== -1) {
      const [c1, c2] = mergePair
      const mergedPixels = clusters[c1].concat(clusters[c2])
      let sumL = 0, sumA = 0, sumB = 0
      for (const idx of mergedPixels) {
        sumL += filteredPixels[idx].l
        sumA += filteredPixels[idx].a
        sumB += filteredPixels[idx].labB
      }
      const count = mergedPixels.length
      currentCentroids[c1] = { l: sumL / count, a: sumA / count, labB: sumB / count }
      clusters[c1] = mergedPixels
      activeClusters[c2] = false
      clusters[c2] = []
      merged++
      mergedThisRound = true
    }
  }

  const newLabels = new Array(filteredPixels.length).fill(-1)
  const finalCentroids: LabCentroid[] = []
  let newId = 0
  for (let i = 0; i < k; i++) {
    if (activeClusters[i]) {
      finalCentroids.push(currentCentroids[i])
      for (const pixelIdx of clusters[i]) {
        newLabels[pixelIdx] = newId
      }
      newId++
    }
  }

  return { labels: newLabels, centroids: finalCentroids, mergedCount: merged }
}

function mergeToTargetCount(
  filteredPixels: LabPixel[],
  initialLabels: number[],
  initialCentroids: LabCentroid[],
  targetCount: number,
): { labels: number[]; centroids: LabCentroid[]; mergedCount: number; finalThreshold: number } {
  const k = initialCentroids.length
  if (k <= targetCount) {
    return { labels: initialLabels, centroids: initialCentroids, mergedCount: 0, finalThreshold: 0 }
  }

  const clusters: number[][] = Array.from({ length: k }, () => [])
  for (let i = 0; i < filteredPixels.length; i++) {
    clusters[initialLabels[i]].push(i)
  }

  const currentCentroids = initialCentroids.map(c => ({ l: c.l, a: c.a, labB: c.labB }))
  const currentClusters = clusters.map(c => [...c])
  const active = new Array(k).fill(true)
  let activeCount = k
  let merged = 0
  let lastMergeDist = 0

  while (activeCount > targetCount) {
    let minDist = Infinity
    let pair: [number, number] = [-1, -1]
    const activeIds: number[] = []
    for (let i = 0; i < k; i++) if (active[i]) activeIds.push(i)

    for (let a = 0; a < activeIds.length; a++) {
      for (let b = a + 1; b < activeIds.length; b++) {
        const i = activeIds[a], j = activeIds[b]
        const dl = currentCentroids[i].l - currentCentroids[j].l
        const da = currentCentroids[i].a - currentCentroids[j].a
        const db = currentCentroids[i].labB - currentCentroids[j].labB
        const dist = Math.sqrt(dl * dl + da * da + db * db)
        if (dist < minDist) { minDist = dist; pair = [i, j] }
      }
    }

    const [c1, c2] = pair
    const mergedPixels = currentClusters[c1].concat(currentClusters[c2])
    let sumL = 0, sumA = 0, sumB = 0
    for (const idx of mergedPixels) {
      sumL += filteredPixels[idx].l
      sumA += filteredPixels[idx].a
      sumB += filteredPixels[idx].labB
    }
    const count = mergedPixels.length
    currentCentroids[c1] = { l: sumL / count, a: sumA / count, labB: sumB / count }
    currentClusters[c1] = mergedPixels
    active[c2] = false
    currentClusters[c2] = []
    activeCount--
    merged++
    lastMergeDist = minDist
  }

  const newLabels = new Array(filteredPixels.length).fill(-1)
  const finalCentroids: LabCentroid[] = []
  let newId = 0
  for (let i = 0; i < k; i++) {
    if (active[i]) {
      finalCentroids.push(currentCentroids[i])
      for (const pixelIdx of currentClusters[i]) {
        newLabels[pixelIdx] = newId
      }
      newId++
    }
  }

  return { labels: newLabels, centroids: finalCentroids, mergedCount: merged, finalThreshold: lastMergeDist }
}

/* ---------- 主入口 ---------- */

/**
 * 主提取函数：RGB K-Means++ 聚类 → LAB 空间合并 → 生成调色板
 */
export function extractColors(
  labPixels: LabPixel[],
  params: ExtractParams,
): ExtractResult {
  let filtered = labPixels
  if (params.filterExtreme) {
    filtered = labPixels.filter(p => p.l > 8 && p.l < 92)
    if (filtered.length < params.initialK * 10) filtered = labPixels
  }
  if (filtered.length === 0) {
    return { palette: [], initialClusters: 0, finalClusters: 0, mergedCount: 0, finalThreshold: 0 }
  }

  // 多次 RGB 聚类取最优 SSE
  const runs = Math.min(3, Math.max(1, Math.floor(filtered.length / 5000)))
  let bestResult: { centroids: RgbCentroid[]; labels: number[] } | null = null
  let bestSSE = Infinity

  for (let run = 0; run < runs; run++) {
    const result = kmeansRgb(filtered, Math.min(params.initialK, filtered.length), 50, 1.0)
    let sse = 0
    for (let i = 0; i < filtered.length; i++) {
      const c = result.centroids[result.labels[i]]
      const dr = filtered[i].r - c.r, dg = filtered[i].g - c.g, db = filtered[i].b - c.b
      sse += dr * dr + dg * dg + db * db
    }
    if (sse < bestSSE) { bestSSE = sse; bestResult = result }
  }

  const { centroids: rgbCentroids } = bestResult!
  let { labels } = bestResult!

  // RGB 中心 → LAB
  let labCentroids: LabCentroid[] = rgbCentroids.map(c => {
    const lab = rgbToLab(Math.round(c.r), Math.round(c.g), Math.round(c.b))
    return { l: lab.l, a: lab.a, labB: lab.b }
  })

  let mergedCount = 0
  let finalThreshold = 0

  if (params.enableMerge && labCentroids.length > 1) {
    if (params.targetCount > 0 && params.targetCount < labCentroids.length) {
      const mr = mergeToTargetCount(filtered, labels, labCentroids, params.targetCount)
      labels = mr.labels
      labCentroids = mr.centroids
      mergedCount = mr.mergedCount
      finalThreshold = mr.finalThreshold
    } else if (params.mergeThreshold > 0) {
      const mr = mergeCloseClusters(filtered, labels, labCentroids, params.mergeThreshold)
      labels = mr.labels
      labCentroids = mr.centroids
      mergedCount = mr.mergedCount
      finalThreshold = -1
    }
  }

  const kk = labCentroids.length
  const clusterCounts = new Array(kk).fill(0)
  const bestPixels: (number | null)[] = new Array(kk).fill(null)
  const bestDists = new Array(kk).fill(Infinity)

  for (let i = 0; i < filtered.length; i++) {
    const cl = labels[i]
    if (cl === -1) continue
    clusterCounts[cl]++
    const ct = labCentroids[cl]
    const dl = filtered[i].l - ct.l, da = filtered[i].a - ct.a, db = filtered[i].labB - ct.labB
    const dist = dl * dl + da * da + db * db
    if (dist < bestDists[cl]) {
      bestDists[cl] = dist
      bestPixels[cl] = i
    }
  }

  const total = filtered.length
  const palette: PaletteColor[] = []

  for (let j = 0; j < kk; j++) {
    if (clusterCounts[j] === 0 || bestPixels[j] === null) continue
    const pix = filtered[bestPixels[j]!]
    const hex = rgbToHex(pix.r, pix.g, pix.b)
    const hsl = rgbToHsl(pix.r, pix.g, pix.b)
    palette.push({
      r: pix.r, g: pix.g, b: pix.b, hex, hsl,
      percentage: (clusterCounts[j] / total) * 100,
      count: clusterCounts[j],
    })
  }

  palette.sort((a, b) => b.percentage - a.percentage)

  return {
    palette,
    initialClusters: params.initialK,
    finalClusters: palette.length,
    mergedCount,
    finalThreshold,
  }
}

/** 算法元数据 */
export const algorithmMeta = {
  key: 'kmeans',
  name: 'K-Means',
  description: 'RGB K-Means++ 聚类 + LAB 空间感知合并',
} as const
