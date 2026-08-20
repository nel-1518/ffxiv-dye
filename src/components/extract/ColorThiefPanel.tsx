
import { Slider, Switch } from 'antd'

interface ColorThiefPanelProps {
  targetCount: number
  quality: number
  includeMetallic: boolean
  onTargetCountChange: (v: number) => void
  onQualityChange: (v: number) => void
  onIncludeMetallicChange: (v: boolean) => void
  onExtract: () => void
}

/** Color Thief (MMCQ) 算法的控制面板 */
export default function ColorThiefPanel({
  targetCount,
  quality,
  includeMetallic,
  onTargetCountChange,
  onQualityChange,
  onIncludeMetallicChange,
  onExtract,
}: ColorThiefPanelProps) {
  return (
    <>
      <div className="extract-control-row">
        <span className="extract-control-label">颜色数量</span>
        <div className="extract-slider-group">
          <Slider
            min={0}
            max={20}
            step={1}
            value={targetCount}
            onChange={v => onTargetCountChange(v)}
            onAfterChange={() => onExtract()}
            style={{ flex: 1 }}
          />
          <span className="extract-slider-value">{targetCount || '自动'}</span>
        </div>
      </div>
      <div className="extract-control-row">
        <span className="extract-control-label">采样质量</span>
        <div className="extract-slider-group">
          <Slider
            min={1}
            max={50}
            step={1}
            value={quality}
            onChange={v => onQualityChange(v)}
            onAfterChange={() => onExtract()}
            style={{ flex: 1 }}
          />
          <span className="extract-slider-value">{quality}</span>
        </div>
      </div>

      {/* 包含金属色 */}
      <div className="extract-control-row">
        <span className="extract-control-label">包含金属色</span>
        <Switch
          checked={includeMetallic}
          onChange={v => onIncludeMetallicChange(v)}
          size="small"
        />
      </div>
    </>
  )
}
