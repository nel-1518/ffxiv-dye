/* ===== 提取结果色卡网格组件 ===== */

import type { PaletteColor } from '../../utils/algorithms/types'

interface PaletteGridProps {
  palette: PaletteColor[]
  onCopyColor: (hex: string) => void
}

/* ---------- 相对亮度（决定色块文字颜色） ---------- */

function relativeLuminance(r: number, g: number, b: number): number {
  const sr = (c: number) => {
    c /= 255
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * sr(r) + 0.7152 * sr(g) + 0.0722 * sr(b)
}

/* ---------- 组件 ---------- */

export default function PaletteGrid({ palette, onCopyColor }: PaletteGridProps) {
  return (
    <div className="extract-results">
      <div className="extract-palette-grid">
        {palette.map((color, idx) => {
          const lum = relativeLuminance(color.r, color.g, color.b)
          const textColor = lum > 0.45 ? '#1a1a2e' : '#ffffff'
          return (
            <div
              key={idx}
              className="extract-color-card"
              onClick={() => onCopyColor(color.hex)}
            >
              <div
                className="extract-color-swatch"
                style={{ background: color.hex, color: textColor }}
              >
                <span className="extract-color-percentage">
                  {color.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="extract-color-info">
                <div className="extract-color-hex">{color.hex}</div>
                <div className="extract-color-rgb">
                  RGB({color.r}, {color.g}, {color.b})
                </div>
                <div className="extract-color-bar">
                  <div
                    className="extract-color-bar-fill"
                    style={{ width: `${color.percentage}%`, background: color.hex }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
