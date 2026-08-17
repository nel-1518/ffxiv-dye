/* ===== 配色推荐算法 v3 =====
 * 基于色彩几何与感知算法，从 FFXIV 染色剂颜色池中自动挑选和谐的颜色组合。
 *
 * v3 参考 Codrops《Coloring With Code — A Programmatic Approach to Design》
 * (https://tympanus.net/codrops/2021/12/07/coloring-with-code-a-programmatic-approach-to-design/)
 * - 核心：感知均匀的 LCH 空间做明度/彩度度量，替代 v2 的 HSL 分离评分。
 * - 混合色相策略：**HSL 色相做环形旋转基准**（染剂池在 HSL 色相上分布均匀、
 *   符合直觉：红=0°），**LCH 明度/彩度做距离度量**（感知正确）。
 *   纯 LCH 色相在 FFXIV 染剂池中分布极不均匀（约一半颜色挤在 0°~120°），
 *   直接旋转会导致目标窗口失衡，故不采用。
 * - 每个槽位定义"目标色点"（目标色相 + 阶梯化期望明度 + 基准彩度），
 *   相当于文章的 Scientific 法（同 L 同 C 转色相）与 Discovery 法
 *   （感知最近邻匹配）在离散染剂池上的落地
 * - 保留 v2 已验证的机制：allocateTargets 目标分配、softmax 温度采样、
 *   60° 色相硬阈值、CIEDE2000 排斥、可复现 seed、buildColorPool 预计算
 */

import { hexToRgb, rgbToHsl, rgbToLab, rgbToLch, contrastRatio, hueDiff, ciede2000 } from './color'

/* ---------- 类型 ---------- */

export type SchemeMode =
  | 'smart'
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'split-complementary'
  | 'tetradic'
  | 'monochromatic'

export interface SchemeResult {
  /** 选中的颜色 hex 数组，按感知明度排序（浅→深） */
  colors: string[]
  /** 最深 vs 最浅的 WCAG 对比度比率 */
  contrastRatio: number
  /** 相邻色之间的最小 WCAG 对比度（防止色条中间出现断层） */
  minAdjacentContrast: number
  /** WCAG 级别 */
  wcagLevel: 'AAA' | 'AA' | 'FAIL'
}

/** 预计算后的颜色池条目（避免每次生成都重复做色空间转换） */
export interface PoolColor {
  hex: string
  h: number // HSL 色相 0-360
  s: number // HSL 饱和度 0-1
  l: number // HSL 明度 0-1
  L: number // CIELAB L*（感知明度，0=黑 100=白）
  a: number // CIELAB a*
  b: number // CIELAB b*
  lch: { l: number; c: number; h: number } // LCH（感知均匀，v3 评分主用）
}

export type ColorPool = PoolColor[]

/**
 * 将 hex 数组预计算为颜色池索引。
 * 调用方可 useMemo 缓存，例如：
 *   const pool = useMemo(() => buildColorPool(hexes), [])
 */
export function buildColorPool(pool: string[]): ColorPool {
  return pool.map((hex) => {
    const [r, g, b] = Object.values(hexToRgb(hex)) as [number, number, number]
    const hsl = rgbToHsl(r, g, b)
    const lab = rgbToLab(r, g, b)
    const lchC = rgbToLch(r, g, b)
    return { hex, h: hsl.h, s: hsl.s, l: hsl.l, L: lab.l, a: lab.a, b: lab.b, lch: lchC }
  })
}

/* ---------- 种子随机（Park-Miller LCG） ---------- */

let _seed = 1
let _callCounter = 0

function seededRandom(): number {
  _seed = (_seed * 16807) % 2147483647
  return _seed / 2147483647
}

/**
 * 重置种子：传入 seed 可复现结果；否则用"调用计数 × 黄金分割哈希 ⊕ 高精度时间"混合，
 * 避免同毫秒内连续调用产生相同序列。
 */
function resetSeed(seed?: number): void {
  _callCounter = (_callCounter + 1) | 0
  const mix = Math.imul(_callCounter, 2654435761) ^ Math.floor(performance.now() * 1000)
  let s = seed ?? (mix >>> 0)
  s = s % 2147483647
  if (s <= 0) s += 2147483646
  if (s === 0) s = 1
  _seed = s
}

/* ---------- 模式 → 建议色相 ---------- */

/** 各配色模式围绕基准色相生成"建议色相"（含基准色本身） */
function modeSuggestions(mode: SchemeMode, baseHue: number): number[] {
  const jitter = (r: number) => (seededRandom() - 0.5) * 2 * r
  const wrap = (h: number) => ((h % 360) + 360) % 360

  switch (mode) {
    case 'complementary':
      return [baseHue, wrap(baseHue + 180 + jitter(15))]
    case 'analogous':
      // 文章 Scientific 法：analogous = [0, 30, 60]，向两侧连续递进
      return [baseHue, wrap(baseHue + 30 + jitter(10)), wrap(baseHue + 60 + jitter(10)), wrap(baseHue - 30 + jitter(10)), wrap(baseHue - 60 + jitter(10))]
    case 'triadic':
      return [baseHue, wrap(baseHue + 120 + jitter(12)), wrap(baseHue + 240 + jitter(12))]
    case 'split-complementary':
      return [baseHue, wrap(baseHue + 150 + jitter(10)), wrap(baseHue + 210 + jitter(10))]
    case 'tetradic':
      return [
        baseHue,
        wrap(baseHue + 90 + jitter(10)),
        wrap(baseHue + 180 + jitter(10)),
        wrap(baseHue + 270 + jitter(10)),
      ]
    case 'monochromatic':
      return [
        wrap(baseHue + jitter(8)),
        wrap(baseHue + jitter(8)),
        wrap(baseHue + jitter(8)),
      ]
    case 'smart':
      return [
        baseHue,
        wrap(baseHue + 150 + seededRandom() * 60),
        wrap(baseHue + 30 + jitter(10)),
      ]
  }
}

/**
 * 为剩余槽位分配目标色相：
 * - 循环建议色相，跳过与已选基准色相过近（< 25°）的项（monochromatic 除外，其本质就是同色相变化）
 * - 建议用尽后以环形均匀分布兜底
 * 修复原实现 `i % targetHues.length` 模循环导致已选基准色被重复匹配的问题（#1）。
 */
function allocateTargets(
  mode: SchemeMode,
  baseHue: number,
  lockedHues: number[],
  remaining: number,
): number[] {
  const suggestions = modeSuggestions(mode, baseHue)
  const targets: number[] = []
  const skipCovered = mode !== 'monochromatic'

  const maxIter = suggestions.length + remaining * 3
  for (let k = 0; targets.length < remaining && k < maxIter; k++) {
    const t = suggestions[k % suggestions.length]
    if (skipCovered && lockedHues.some((h) => hueDiff(h, t) < 25)) continue
    targets.push(t)
  }

  // 兜底：从对侧开始环形补充，跳过已分配的近邻色相
  for (let fill = 0; targets.length < remaining && fill < 6; fill++) {
    const t = ((baseHue + 180 + fill * 60) % 360 + 360) % 360
    if (targets.some((x) => hueDiff(x, t) < 25)) continue
    targets.push(t)
  }

  return targets
}

/* ---------- 候选评分（HSL 色相 + LCH 明度彩度，v3.1） ---------- */

/**
 * 目标色点：目标色相 + 期望感知明度 + 目标彩度。
 * 参考文章 Scientific 法：围绕基准色保持 L/C、仅旋转色相；
 * 这里把明度做阶梯化（每槽位不同期望明度），让离散池选色也能形成明度层次。
 */
interface TargetPoint {
  h: number // 目标色相（HSL，环形旋转基准）
  l: number // 期望 LCH 明度（阶梯化）
  c: number // 目标 LCH 彩度（贴近基准）
}

/**
 * 综合评分，范围约 [0, 1]：
 *  1. distScore —— 混合感知距离（高斯转换到 [0,1]）：
 *     - 色相：HSL 色相差（环形，直算角度差，无彩度放大）
 *     - 明度/彩度：LCH 差（感知均匀，替代 v2 分离评分）
 *  2. distinctScore —— CIEDE2000 感知差异排斥：与任一已选色 ΔE 至少 ≥ 30（#6）
 *  3. ladderPenalty —— 相邻明度太近（L* 差 < 12）时降权，避免深色段"糊在一起"
 */
function scoreCandidate(
  c: PoolColor,
  target: TargetPoint,
  selected: PoolColor[],
): number {
  // 1) 混合感知距离
  const dH = hueDiff(c.h, target.h) // HSL 色相，权重最高
  const dL = c.lch.l - target.l // LCH 明度
  const dC = c.lch.c - target.c // LCH 彩度
  const d = Math.sqrt(1.0 * dH * dH + 0.25 * dL * dL + 0.16 * dC * dC)
  const distScore = Math.exp(-d / 22)

  // 2) 感知差异排斥（ΔE < 30 肉眼几乎无法区分）
  let minDE = 30
  // 3) 相邻明度最小差（L* < 12 视为"贴在一起"）
  let minLDiff = 100
  for (const s of selected) {
    const de = ciede2000(c.L, c.a, c.b, s.L, s.a, s.b)
    if (de < minDE) minDE = de
    const ld = Math.abs(c.L - s.L)
    if (ld < minLDiff) minLDiff = ld
  }
  const distinctScore = Math.min(1, minDE / 30)
  const ladderPenalty = minLDiff < 12 ? 0.5 : 1

  return (0.85 * distScore + 0.15 * distinctScore) * ladderPenalty
}

/** softmax 温度采样：weight = exp(score / T)，T 越小越偏向高分（T=0.2）（#4） */
function softmaxPick(candidates: { color: PoolColor; score: number }[]): PoolColor | null {
  if (candidates.length === 0) return null
  const T = 0.2
  const weights = candidates.map(({ color, score }) => ({ color, w: Math.exp(score / T) }))
  const total = weights.reduce((a, x) => a + x.w, 0)
  let rand = seededRandom() * total
  for (const { color, w } of weights) {
    rand -= w
    if (rand <= 0) return color
  }
  return weights[weights.length - 1].color
}

/* ---------- 核心：从颜色池中按模式挑选 ---------- */

/**
 * 从预设颜色池中挑选和谐的颜色组合。
 * @param pool - 可用颜色池（hex 数组或 buildColorPool 预计算索引）
 * @param mode - 搭配模式
 * @param count - 挑选数量 (3-5)
 * @param baseColors - 用户选择的基准色 hex（0-3 个），空则随机选基准
 * @param seed - 可选随机种子，传同一值可复现同一结果（#8）
 */
export function selectSchemeColors(
  pool: string[] | ColorPool,
  mode: SchemeMode,
  count: number,
  baseColors: string[],
  seed?: number,
): SchemeResult {
  resetSeed(seed)

  // 统一为预计算索引（#7：避免重复色空间转换）
  const colors: ColorPool = pool.length > 0 && typeof pool[0] === 'string'
    ? buildColorPool(pool as string[])
    : (pool as ColorPool)

  const empty: SchemeResult = {
    colors: [],
    contrastRatio: 0,
    minAdjacentContrast: 0,
    wcagLevel: 'FAIL',
  }
  if (colors.length === 0) return empty

  const byHex = new Map<string, PoolColor>(colors.map((c) => [c.hex, c]))

  // 基准色：用户选中 → 第一个选中色；否则随机
  const baseHex = baseColors.length > 0
    ? baseColors[0]
    : colors[Math.floor(seededRandom() * colors.length)].hex

  // 已选集合（含用户锁定的 1-3 个基准色）
  const selected: PoolColor[] = []
  const used = new Set<string>()
  const lockedHues: number[] = []
  const push = (hex: string | undefined): void => {
    if (!hex) return
    const pc = byHex.get(hex)
    if (!pc || used.has(hex)) return
    used.add(hex)
    selected.push(pc)
    lockedHues.push(pc.h) // HSL 色相（环形旋转基准）
  }
  push(baseHex)
  push(baseColors[1])
  push(baseColors[2])

  if (selected.length === 0) return empty

  // v3.1：HSL 色相做环形旋转基准（染剂池分布均匀、直觉正确）
  const baseHue = selected[0].h
  const remaining = Math.max(0, Math.min(count, 5) - selected.length)

  // 为剩余槽位分配目标色相（修复 #1：不再模循环重复匹配已选基准色）
  const targets = allocateTargets(mode, baseHue, lockedHues, remaining)

  // 目标彩度：基准色 LCH 彩度（下限 20，避免灰色基准导致只能选灰）
  const baseLch = selected[0].lch
  const targetC = Math.max(baseLch.c, 20)

  // 明度阶梯范围：向深/浅各伸展（受边界限制），让离散池选色形成明度层次
  const spreadDown = Math.min(40, baseLch.l - 10)
  const spreadUp = Math.min(40, 95 - baseLch.l)

  // 逐个挑选（目标色点 = 目标 HSL 色相 + 阶梯 LCH 明度 + 基准彩度）
  // #3 硬阈值：默认 60°；monochromatic 收紧到 25° 保持"同色相"语义
  const hueGate = mode === 'monochromatic' ? 25 : 60
  targets.forEach((targetHue, k) => {
    // 槽位期望明度：t∈[0,1] 均匀分布在基准明度两侧
    const t = targets.length > 1 ? k / (targets.length - 1) : 0.5
    const targetL = baseLch.l + (t - 0.5) * 2 * (t < 0.5 ? spreadDown : spreadUp)
    const target: TargetPoint = { h: targetHue, l: targetL, c: targetC }

    let eligibles = colors.filter((cc) => !used.has(cc.hex) && hueDiff(cc.h, targetHue) <= hueGate)
    // 候选不足时逐步放宽：30° → 60°
    if (eligibles.length === 0) {
      eligibles = colors.filter((cc) => !used.has(cc.hex) && hueDiff(cc.h, targetHue) <= 60)
    }
    if (eligibles.length === 0) {
      eligibles = colors.filter((cc) => !used.has(cc.hex))
    }

    const scored = eligibles.map((cc) => ({
      color: cc,
      score: scoreCandidate(cc, target, selected),
    }))

    const chosen = softmaxPick(scored)
    if (!chosen) return
    used.add(chosen.hex)
    selected.push(chosen)
  })

  // #5 按感知明度排序（浅→深）
  selected.sort((a, b) => b.L - a.L)
  const hexes = selected.map((c) => c.hex)

  // 最深 vs 最浅（WCAG）
  const ratio = hexes.length >= 2
    ? contrastRatio(hexes[hexes.length - 1], hexes[0])
    : 0

  // 相邻最小对比度（防中间断层）（#5）
  let minAdjacent = ratio
  if (hexes.length >= 2) {
    minAdjacent = Infinity
    for (let i = 0; i < hexes.length - 1; i++) {
      const r = contrastRatio(hexes[i + 1], hexes[i])
      if (r < minAdjacent) minAdjacent = r
    }
  }

  let wcagLevel: SchemeResult['wcagLevel'] = 'FAIL'
  if (ratio >= 7) wcagLevel = 'AAA'
  else if (ratio >= 4.5) wcagLevel = 'AA'

  return {
    colors: hexes,
    contrastRatio: Math.round(ratio * 100) / 100,
    minAdjacentContrast: Math.round(minAdjacent * 100) / 100,
    wcagLevel,
  }
}
