/* ===== 算法注册表 ===== */

import type { AlgorithmFn, AlgorithmMeta } from './types'
import { extractColors as colorthiefExtract, algorithmMeta as colorthiefMeta } from './colorthief'
import { extractColors as kmeansExtract, algorithmMeta as kmeansMeta } from './kmeans'

export interface AlgorithmRecord {
  meta: AlgorithmMeta
  fn: AlgorithmFn
}

const registry: Record<string, AlgorithmRecord> = {
  [colorthiefMeta.key]: { meta: colorthiefMeta, fn: colorthiefExtract },
  [kmeansMeta.key]: { meta: kmeansMeta, fn: kmeansExtract },
}

/** 获取所有注册算法列表 */
export function getAlgorithmList(): AlgorithmMeta[] {
  return Object.values(registry).map(r => r.meta)
}

/** 按 key 获取算法 */
export function getAlgorithm(key: string): AlgorithmRecord | undefined {
  return registry[key]
}

/** 注册新算法（供后续扩展） */
export function registerAlgorithm(meta: AlgorithmMeta, fn: AlgorithmFn): void {
  registry[meta.key] = { meta, fn }
}
