import { useState, useMemo, useCallback } from 'react'
import { Button, Tooltip, Tabs } from 'antd'
import { CheckOutlined, ColumnWidthOutlined, ExperimentOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import colorData from '../../data/colors.json'
import type { Color } from '../../types/color'
import { selectSchemeColors, type SchemeMode } from '../../utils/schemeAlgorithm'

/* ---------- 常量 ---------- */

const COLORS: Color[] = colorData as Color[]

/** type 显示名称映射 */
const TYPE_LABELS: Record<string, string> = {
  '灰': '灰色系',
  '红': '红色系',
  '棕': '棕色系',
  '黄': '黄色系',
  '绿': '绿色系',
  '蓝': '蓝色系',
  '紫': '紫色系',
}

const TYPE_ORDER = ['灰', '红', '棕', '黄', '绿', '蓝', '紫']

const MODE_NAMES: Record<SchemeMode, string> = {
  smart: '综合',
  complementary: '互补色 (180°)',
  analogous: '类似色 (±30°)',
  triadic: '三角色 (120°)',
}

const ALL_MODES: SchemeMode[] = ['smart', 'complementary', 'analogous', 'triadic']

const SCHEME_COUNT = 5

/** 配色结果类型 */
interface SchemeResultItem {
  mode: SchemeMode
  modeLabel: string
  colors: string[]
  contrastRatio: number
  wcagLevel: string
}

/* ---------- 工具 ---------- */

function isLight(hex: string): boolean {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  return lum > 140
}

/* ---------- 色块子组件 ---------- */

function ColorSwatch({
  color,
  isSelected,
  onClick,
}: {
  color: Color
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <Tooltip title={`${color.name} ${color.color}`}>
      <button
        className="scheme-swatch"
        style={{ backgroundColor: color.color }}
        onClick={onClick}
        aria-label={`选择 ${color.name}`}
      >
        {isSelected && (
          <CheckOutlined className="scheme-swatch__check" />
        )}
      </button>
    </Tooltip>
  )
}

/* ---------- 配色结果卡片子组件 ---------- */

function SchemeCard({ item, viewMode, showLabels }: { item: SchemeResultItem; viewMode: 'strip' | 'circle'; showLabels: boolean }) {
  return (
    <div className="scheme-card">
      <h4 className="scheme-card__title">{item.modeLabel}</h4>
      {viewMode === 'strip' ? (
        <div className="scheme-strip">
          {item.colors.map((hex, i) => (
            <div
              key={i}
              className="scheme-strip__item"
              style={{
                backgroundColor: hex,
                color: isLight(hex) ? '#333' : '#fff',
              }}
            >
              {showLabels && (
                <>
                  <span className="scheme-strip__hex">{hex.toUpperCase()}</span>
                  <span className="scheme-strip__name">
                    {COLORS.find((c) => c.color === hex)?.name ?? ''}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="scheme-circle-row">
          {item.colors.map((hex, i) => (
            <Tooltip key={i} title={`${COLORS.find((c) => c.color === hex)?.name ?? ''} ${hex.toUpperCase()}`}>
              <div
                className="scheme-circle-swatch"
                style={{ backgroundColor: hex }}
              >
                {showLabels && (
                  <span className="scheme-circle-swatch__hex">{hex.toUpperCase()}</span>
                )}
              </div>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- 主组件 ---------- */

function SchemePage() {
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [results, setResults] = useState<SchemeResultItem[] | null>(null)
  const [viewMode, setViewMode] = useState<'strip' | 'circle'>('strip')
  const [showLabels, setShowLabels] = useState(false)

  // 颜色池
  const pool = useMemo(() => COLORS.map((c) => c.color), [])

  // 颜色按 type 分组
  const groupedColors = useMemo(() => {
    const map: Record<string, Color[]> = {}
    COLORS.forEach((c) => {
      if (!map[c.type]) map[c.type] = []
      map[c.type].push(c)
    })
    return TYPE_ORDER.filter((t) => map[t]).map((t) => ({ type: t, colors: map[t] }))
  }, [])

  const handleSwatchClick = useCallback((hex: string) => {
    setSelectedColors((prev) => {
      if (prev.includes(hex)) return prev.filter((h) => h !== hex)
      if (prev.length >= 3) return [prev[1], prev[2], hex]
      return [...prev, hex]
    })
  }, [])

  // 生成全部 4 个模式配色
  const handleGenerate = useCallback(() => {
    const items: SchemeResultItem[] = ALL_MODES.map((mode) => {
      const res = selectSchemeColors(pool, mode, SCHEME_COUNT, selectedColors)
      return {
        mode,
        modeLabel: MODE_NAMES[mode],
        colors: res.colors,
        contrastRatio: res.contrastRatio,
        wcagLevel: res.wcagLevel,
      }
    })
    setResults(items)
  }, [pool, selectedColors])

  return (
    <div className="scheme-page">
      <div className="scheme-container">

        {/* 颜色池（Tabs 切换分类） */}
        <section className="scheme-pool-section">
          <h3 className="scheme-section-title">
            染剂颜色
          </h3>
          <Tabs
            items={groupedColors.map(({ type, colors }) => ({
              key: type,
              label: `${TYPE_LABELS[type] || type}`,
              children: (
                <div className="scheme-pool">
                  {colors.map((c) => (
                    <ColorSwatch
                      key={c.color}
                      color={c}
                      isSelected={selectedColors.includes(c.color)}
                      onClick={() => handleSwatchClick(c.color)}
                    />
                  ))}
                </div>
              ),
            }))}
          />

          {/* 底部：已选基准色 + 生成按钮 */}
          <div className="scheme-pool-footer">
            {selectedColors.length > 0 ? (
              <>
                <div className="scheme-pool-footer__chips">
                  {selectedColors.map((hex) => (
                    <span
                      key={hex}
                      className="scheme-pool-chip"
                      style={{ backgroundColor: hex }}
                      onClick={() => handleSwatchClick(hex)}
                      title={`点击移除 ${COLORS.find((c) => c.color === hex)?.name ?? hex}`}
                    />
                  ))}
                </div>
                <div className="scheme-pool-footer__names">
                  {selectedColors.map((hex) => (
                    <span key={hex} className="scheme-pool-name">
                      {COLORS.find((c) => c.color === hex)?.name ?? hex}
                    </span>
                  ))}
                </div>
                <button
                  className="scheme-nav-btn"
                  onClick={handleGenerate}
                  disabled={selectedColors.length === 0}
                >
                  生成配色
                </button>
              </>
            ) : (
              <span className="scheme-pool-hint">
                点击上方色块选择基准色（最多 3 个）
              </span>
            )}
          </div>
        </section>

        {/* 结果展示（4 个卡片） */}
        {results && (
          <section className="scheme-results-section">
            <div className="scheme-results-header">
              <h3 className="scheme-section-title" style={{ margin: 0 }}>配色结果</h3>
              <div className="scheme-results-actions">
                <Tooltip title={showLabels ? '隐藏色块内文字' : '显示色块内文字'}>
                  <Button
                    size="small"
                    className="scheme-label-toggle"
                    icon={showLabels ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    onClick={() => setShowLabels((v) => !v)}
                  />
                </Tooltip>
                <div className="scheme-view-toggle">
                  <Button
                    size="small"
                    type={viewMode === 'strip' ? 'primary' : 'default'}
                    icon={<ColumnWidthOutlined />}
                    onClick={() => setViewMode('strip')}
                  />
                  <Button
                    size="small"
                    type={viewMode === 'circle' ? 'primary' : 'default'}
                    icon={<ExperimentOutlined />}
                    onClick={() => setViewMode('circle')}
                  />
                </div>
              </div>
            </div>
            <div className="scheme-results-grid">
              {results.map((item) => (
                <SchemeCard key={item.mode} item={item} viewMode={viewMode} showLabels={showLabels} />
              ))}
            </div>
            <p className="scheme-disclaimer">
              算法自动生成配色，不一定可用，仅供参考。
            </p>
          </section>
        )}
      </div>
    </div>
  )
}

export default SchemePage
