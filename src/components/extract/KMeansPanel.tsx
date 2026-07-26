import { Switch, Slider, Select } from "antd";

interface KMeansPanelProps {
  dynamicK: boolean;
  initialK: number;
  mergeMode: "target" | "threshold";
  targetCount: number;
  mergeThreshold: number;
  filterExtreme: boolean;
  histogramInfo: { k: number; m: number } | null;
  onDynamicKChange: (v: boolean) => void;
  onInitialKChange: (v: number) => void;
  onMergeModeChange: (v: "target" | "threshold") => void;
  onTargetCountChange: (v: number) => void;
  onMergeThresholdChange: (v: number) => void;
  onFilterExtremeChange: (v: boolean) => void;
  onRunExtraction: (k: number) => void;
  onAutoExtract: () => void;
}

/** K-Means 算法的控制面板 */
export default function KMeansPanel({
  dynamicK,
  initialK,
  mergeMode,
  targetCount,
  mergeThreshold,
  filterExtreme,
  histogramInfo,
  onDynamicKChange,
  onInitialKChange,
  onMergeModeChange,
  onTargetCountChange,
  onMergeThresholdChange,
  onFilterExtremeChange,
  onRunExtraction,
  onAutoExtract,
}: KMeansPanelProps) {
  return (
    <>
      {/* 合并模式 */}
      <div className="extract-control-row">
        <span className="extract-control-label">合并模式</span>
        <Select
          value={mergeMode}
          onChange={(v) => onMergeModeChange(v)}
          size="small"
          style={{ width: 120 }}
          options={[
            { label: "目标 N 色", value: "target" },
            { label: "ΔE 阈值", value: "threshold" },
          ]}
        />
      </div>

      {/* 目标颜色数 */}
      {mergeMode === "target" && (
        <div className="extract-control-row">
          <span className="extract-control-label">目标颜色数</span>
          <div className="extract-slider-group">
            <Slider
              min={0}
              max={20}
              step={1}
              value={targetCount}
              onChange={(v) => onTargetCountChange(v)}
              onAfterChange={() => onAutoExtract()}
              style={{ flex: 1 }}
            />
            <span className="extract-slider-value">
              {targetCount || "自动"}
            </span>
          </div>
        </div>
      )}

      {/* 合并阈值 */}
      {mergeMode === "threshold" && (
        <div className="extract-control-row">
          <span className="extract-control-label">合并阈值 ΔE</span>
          <div className="extract-slider-group">
            <Slider
              min={0}
              max={30}
              step={0.5}
              value={mergeThreshold}
              onChange={(v) => onMergeThresholdChange(v)}
              onAfterChange={() => onAutoExtract()}
              style={{ flex: 1 }}
            />
            <span className="extract-slider-value">{mergeThreshold}</span>
          </div>
        </div>
      )}
      {/* 动态定K */}
      <div className="extract-control-row">
        <span className="extract-control-label">动态定K</span>
        <Switch
          checked={dynamicK}
          onChange={(v) => onDynamicKChange(v)}
          size="small"
        />
        {dynamicK && histogramInfo && (
          <span className="extract-histogram-info">
            有效色 <strong>M={histogramInfo.m}</strong>
            <span className="extract-sep">·</span>
            <strong>K={histogramInfo.k}</strong>
          </span>
        )}
      </div>

      {/* 初始K */}
      <div className="extract-control-row">
        <span className="extract-control-label">初始 K</span>
        <div className="extract-slider-group">
          <Slider
            min={2}
            max={30}
            step={1}
            value={dynamicK ? (histogramInfo?.k ?? initialK) : initialK}
            onChange={(v) => onInitialKChange(v)}
            onAfterChange={(v) => {
              if (dynamicK && histogramInfo) {
                onRunExtraction(histogramInfo.k);
              } else {
                onRunExtraction(v);
              }
            }}
            disabled={dynamicK}
            style={{ flex: 1 }}
          />
          <span className="extract-slider-value">
            {dynamicK ? (histogramInfo?.k ?? "—") : initialK}
          </span>
        </div>
      </div>

      {/* 过滤极端亮度 */}
      <div className="extract-control-row">
        <span className="extract-control-label">过滤极端亮度</span>
        <Switch
          checked={filterExtreme}
          onChange={(v) => onFilterExtremeChange(v)}
          size="small"
        />
      </div>
    </>
  );
}
