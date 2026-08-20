/* ===== 染剂匹配视图：双列 + SVG 贝塞尔曲线 ===== */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { message } from 'antd'
import type { PaletteColor } from '../../utils/algorithms/types'
import { findDyeMatches, type DyeMatch } from './dyeMatcher'
import { relativeLuminance, rgbRelativeLuminance } from '../../utils/color'

interface DyeMatchViewProps {
  palette: PaletteColor[]
  /** 匹配染剂时是否允许包含金属色 */
  includeMetallic?: boolean
}

interface CurvePath {
  idx: number
  path: string
  leftColor: string
  dyeKey: string
}

export default function DyeMatchView({ palette, includeMetallic = false }: DyeMatchViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [curves, setCurves] = useState<CurvePath[]>([])
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  /* 同步计算匹配 — palette / includeMetallic 变化时自动重算 */
  const matches = useMemo(() => findDyeMatches(palette, includeMetallic), [palette, includeMetallic])

  /* 获取匹配到同一染剂的 index 集合 */
  const siblingsOf = useCallback((idx: number): Set<number> => {
    const targetKey = matches[idx]?.dye.hex
    if (!targetKey) return new Set()
    const s = new Set<number>()
    matches.forEach(m => { if (m.dye.hex === targetKey) s.add(m.index) })
    return s
  }, [matches])

  const [hoveredSiblings, setHoveredSiblings] = useState<Set<number>>(new Set())

  /* palette 变化时重置 hover（render 中条件调整 state，避免 effect 级联渲染） */
  const [lastPalette, setLastPalette] = useState(palette)
  if (lastPalette !== palette) {
    setLastPalette(palette)
    setHoveredIdx(null)
    setHoveredSiblings(new Set())
  }

  /* ---------- 计算曲线路径 ---------- */

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const recalc = () => {
      const containerRect = container.getBoundingClientRect()
      const leftItems = container.querySelectorAll<HTMLElement>('.dye-match-left-item')
      const rightItems = container.querySelectorAll<HTMLElement>('.dye-match-right-item')

      if (leftItems.length === 0 || rightItems.length === 0) return

      const paths: CurvePath[] = []
      matches.forEach(m => {
        const leftEl = leftItems[m.index]
        /* 找到右侧对应染剂 */
        const dyeHex = m.dye.hex
        let rightEl: HTMLElement | null = null
        for (let i = 0; i < rightItems.length; i++) {
          if (rightItems[i].dataset.dyeHex === dyeHex) {
            rightEl = rightItems[i]
            break
          }
        }
        if (!leftEl || !rightEl) return

        const leftRect = leftEl.getBoundingClientRect()
        const rightRect = rightEl.getBoundingClientRect()

        const x1 = leftRect.right - containerRect.left
        const y1 = leftRect.top + leftRect.height / 2 - containerRect.top
        const x2 = rightRect.left - containerRect.left
        const y2 = rightRect.top + rightRect.height / 2 - containerRect.top

        const dx = Math.abs(x2 - x1)
        const cpOffset = dx * 0.4

        const path = `M ${x1},${y1} C ${x1 + cpOffset},${y1} ${x2 - cpOffset},${y2} ${x2},${y2}`
        paths.push({ idx: m.index, path, leftColor: m.extracted.hex, dyeKey: dyeHex })
      })

      setCurves(paths)
    }

    recalc()
    const observer = new ResizeObserver(recalc)
    observer.observe(container)
    return () => observer.disconnect()
  }, [matches])

  /* ---------- Hover 交互 ---------- */

  const handleLeftEnter = useCallback((idx: number) => {
    setHoveredIdx(idx)
    setHoveredSiblings(siblingsOf(idx))
  }, [siblingsOf])

  const handleRightEnter = useCallback((dyeHex: string) => {
    const s = new Set<number>()
    let firstIdx: number | null = null
    matches.forEach(m => {
      if (m.dye.hex === dyeHex) { s.add(m.index); if (firstIdx === null) firstIdx = m.index }
    })
    setHoveredIdx(firstIdx)
    setHoveredSiblings(s)
  }, [matches])

  const handleLeave = useCallback(() => {
    setHoveredIdx(null)
    setHoveredSiblings(new Set())
  }, [])

  /* ---------- 复制 ---------- */

  const copyColor = useCallback((hex: string) => {
    message.success(`已复制 ${hex}`)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hex).catch(() => fallbackCopy(hex))
    } else {
      fallbackCopy(hex)
    }
  }, [])

  /* ---------- 路径样式 ---------- */

  const getPathStyle = (curve: CurvePath) => {
    const isHovered = hoveredIdx !== null && hoveredSiblings.has(curve.idx)
    const isDimmed = hoveredIdx !== null && !hoveredSiblings.has(curve.idx)
    return {
      stroke: curve.leftColor,
      strokeWidth: isHovered ? 3 : 1.5,
      fill: 'none',
      opacity: isHovered ? 1 : isDimmed ? 0.15 : 0.45,
      transition: 'opacity 0.2s, stroke-width 0.2s',
    }
  }

  /* ---------- 按 hover 排序：hover 的曲线最后渲染（置顶） ---------- */

  const sortedCurves = [...curves].sort((a, b) => {
    const aHover = hoveredIdx !== null && hoveredSiblings.has(a.idx) ? 1 : 0
    const bHover = hoveredIdx !== null && hoveredSiblings.has(b.idx) ? 1 : 0
    return aHover - bHover
  })

  /* ---------- 渲染 ---------- */

  return (
    <div className="extract-results">
      <div className="dye-match-container" ref={containerRef}>
        {/* ===== SVG 曲线层 ===== */}
        <svg className="dye-match-svg">
          {sortedCurves.map(c => (
            <path key={c.idx} d={c.path} style={getPathStyle(c)} />
          ))}
        </svg>

        {/* ===== 左列：提取色 ===== */}
        <div className="dye-match-column dye-match-left">
          <div className="dye-match-column-header">提取色</div>
          {matches.map(m => {
            const lum = rgbRelativeLuminance(m.extracted.r, m.extracted.g, m.extracted.b)
            const textColor = lum > 0.45 ? '#1a1a2e' : '#ffffff'
            const isActive = hoveredIdx !== null && hoveredSiblings.has(m.index)
            return (
              <div
                key={`left-${m.index}`}
                className={`dye-match-left-item${isActive ? ' dye-match-hovered' : ''}`}
                onClick={() => copyColor(m.extracted.hex)}
                onMouseEnter={() => handleLeftEnter(m.index)}
                onMouseLeave={handleLeave}
                data-match-index={m.index}
              >
                <div
                  className="dye-match-swatch"
                  style={{ background: m.extracted.hex, color: textColor }}
                />
                <div className="dye-match-label">
                  <span className="dye-match-hex">{m.extracted.hex}</span>
                  <span className="dye-match-delta">{m.extracted.percentage.toFixed(1)}%</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* ===== 右列：染剂 ===== */}
        <div className="dye-match-column dye-match-right">
          <div className="dye-match-column-header">染剂颜色</div>
          {deduplicatedRight(matches).map(m => {
            const lum = relativeLuminance(m.dye.hex)
            const textColor = lum > 0.45 ? '#1a1a2e' : '#ffffff'
            const isActive = hoveredIdx !== null && hoveredSiblings.has(m.index)
            return (
              <div
                key={`right-${m.dye.hex}`}
                className={`dye-match-right-item${isActive ? ' dye-match-hovered' : ''}`}
                onClick={() => copyColor(m.dye.hex)}
                onMouseEnter={() => handleRightEnter(m.dye.hex)}
                onMouseLeave={handleLeave}
                data-dye-hex={m.dye.hex}
              >
                <div
                  className="dye-match-swatch"
                  style={{ background: m.dye.hex, color: textColor }}
                />
                <div className="dye-match-label">
                  <span className="dye-match-name">{m.dye.name}</span>
                  <span className="dye-match-type">{m.dye.type}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---------- 工具：右列去重（同一染剂只显示一次） ---------- */

function deduplicatedRight(matches: DyeMatch[]): DyeMatch[] {
  const seen = new Set<string>()
  const result: DyeMatch[] = []
  for (const m of matches) {
    if (!seen.has(m.dye.hex)) {
      seen.add(m.dye.hex)
      result.push(m)
    }
  }
  return result
}

/* ---------- 降级复制（clipboard 不可用时） ---------- */

function fallbackCopy(text: string) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
}
