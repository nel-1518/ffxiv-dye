/* ===== 配色推荐算法 =====
 * 基于色彩几何与感知算法，从 FFXIV 染色剂颜色池中自动挑选和谐的颜色组合。
 * 参考 scheme-sample.html 的 Chroma.js 实现，纯 TypeScript 版本，无额外依赖。
 */

/* ---------- 类型 ---------- */

export type SchemeMode = 'smart' | 'complementary' | 'analogous' | 'triadic'

export interface SchemeResult {
  /** 选中的颜色 hex 数组，按明度排序（深→浅） */
  colors: string[]
  /** 对比度比率 */
  contrastRatio: number
  /** WCAG 级别 */
  wcagLevel: 'AAA' | 'AA' | 'FAIL'
}

/* ---------- HSL 类型 ---------- */

interface HSL {
  h: number // 0-360
  s: number // 0-1
  l: number // 0-1
}

/* ---------- hex → RGB ---------- */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

/* ---------- RGB → HSL ---------- */

function rgbToHsl(r: number, g: number, b: number): HSL {
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

function srgbLinear(c: number): number {
  c /= 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * srgbLinear(r) + 0.7152 * srgbLinear(g) + 0.0722 * srgbLinear(b)
}

/* ---------- 对比度 (WCAG) ---------- */

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1)
  const l2 = relativeLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/* ---------- 色相差值 (环形) ---------- */

function hueDiff(h1: number, h2: number): number {
  const d = Math.abs(h1 - h2)
  return Math.min(d, 360 - d)
}

/* ---------- 种子随机 ---------- */

let _seed = 0
function seededRandom(): number {
  _seed = (_seed * 16807 + 0) % 2147483647
  return _seed / 2147483647
}

function resetSeed(): void {
  _seed = Date.now() % 2147483647
}

/* ---------- 核心：从颜色池中按模式挑选 ---------- */

/**
 * 从预设颜色池中挑选和谐的颜色组合。
 * @param pool - 可用颜色 hex 数组
 * @param mode - 搭配模式
 * @param count - 挑选数量 (3-5)
 * @param baseColors - 用户选择的基准色（0-2 个），空则随机选基准
 */
export function selectSchemeColors(
  pool: string[],
  mode: SchemeMode,
  count: number,
  baseColors: string[],
): SchemeResult {
  resetSeed()

  // 确定基准色：用户选中 → 第一个选中色；否则随机
  const baseHex = baseColors.length > 0
    ? baseColors[0]
    : pool[Math.floor(seededRandom() * pool.length)]

  const baseHsl = rgbToHsl(...Object.values(hexToRgb(baseHex)) as [number, number, number])
  const baseHue = baseHsl.h
  const baseLum = relativeLuminance(baseHex)

  // extraBase：如果有第二个选中色，作为第二个锚点
  const extraBase = baseColors.length > 1 ? baseColors[1] : null
  const extraHsl = extraBase
    ? rgbToHsl(...Object.values(hexToRgb(extraBase)) as [number, number, number])
    : null

  // thirdBase：如果有第三个选中色，作为第三个锚点
  const thirdBase = baseColors.length > 2 ? baseColors[2] : null
  const thirdHsl = thirdBase
    ? rgbToHsl(...Object.values(hexToRgb(thirdBase)) as [number, number, number])
    : null

  // 定义目标色相
  let targetHues: number[] = [baseHue]

  if (extraBase && extraHsl) {
    targetHues = [baseHue, extraHsl.h]
  }

  if (thirdBase && thirdHsl) {
    targetHues = [baseHue, extraHsl!.h, thirdHsl.h]
  }

  switch (mode) {
    case 'complementary':
      targetHues.push((baseHue + 180 + (seededRandom() - 0.5) * 30) % 360)
      break
    case 'analogous':
      targetHues.push((baseHue + 30 + (seededRandom() - 0.5) * 20) % 360)
      targetHues.push((baseHue - 30 + (seededRandom() - 0.5) * 20 + 360) % 360)
      break
    case 'triadic':
      targetHues.push((baseHue + 120 + (seededRandom() - 0.5) * 24) % 360)
      targetHues.push((baseHue + 240 + (seededRandom() - 0.5) * 24) % 360)
      break
    case 'smart':
      targetHues.push((baseHue + 150 + seededRandom() * 60) % 360)
      targetHues.push((baseHue + 30 + (seededRandom() - 0.5) * 20) % 360)
      break
  }

  // 基准色作为已选
  const selected: string[] = [baseHex]
  const usedSet = new Set<string>([baseHex])
  if (extraBase) {
    selected.push(extraBase)
    usedSet.add(extraBase)
  }
  if (thirdBase) {
    selected.push(thirdBase)
    usedSet.add(thirdBase)
  }

  // 为每个目标色相挑选颜色（加权随机）
  const startIdx = thirdBase ? 3 : extraBase ? 2 : 1
  for (let i = startIdx; i < count; i++) {
    const targetHue = targetHues[i % targetHues.length]

    interface Candidate { color: string; score: number }
    const candidates: Candidate[] = []

    for (const color of pool) {
      if (usedSet.has(color)) continue

      const hsl = rgbToHsl(...Object.values(hexToRgb(color)) as [number, number, number])
      const h = hsl.h
      const l = relativeLuminance(color)

      const hDiff = hueDiff(h, targetHue)
      const hueScore = Math.max(0, 100 - hDiff)

      let lumScore = 0
      if (mode === 'smart') {
        lumScore = Math.abs(l - baseLum) * 50
      }

      // 随机扰动 ±20%
      const randomFactor = 1 + (seededRandom() - 0.5) * 0.4
      const score = (hueScore + lumScore) * randomFactor

      candidates.push({ color, score })
    }

    // 按分数排序
    candidates.sort((a, b) => b.score - a.score)

    // 从前 N 名中按权重随机选取
    const poolSize = Math.max(5, Math.ceil(candidates.length * 0.3))
    const topPool = candidates.slice(0, poolSize)

    const totalScore = topPool.reduce((s, c) => s + c.score, 0)
    let rand = seededRandom() * totalScore
    let chosen = topPool[0]
    for (const c of topPool) {
      rand -= c.score
      if (rand <= 0) { chosen = c; break }
    }

    if (chosen) {
      selected.push(chosen.color)
      usedSet.add(chosen.color)
    }
  }

  // 按明度排序（深→浅）
  selected.sort((a, b) => relativeLuminance(b) - relativeLuminance(a))

  // 计算对比度：最深 vs 最浅
  const darkest = selected[0]
  const lightest = selected[selected.length - 1]
  const ratio = contrastRatio(lightest, darkest)

  let wcagLevel: SchemeResult['wcagLevel'] = 'FAIL'
  if (ratio >= 7) wcagLevel = 'AAA'
  else if (ratio >= 4.5) wcagLevel = 'AA'

  return { colors: selected, contrastRatio: Math.round(ratio * 100) / 100, wcagLevel }
}
