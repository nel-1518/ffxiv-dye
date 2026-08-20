import { useState, useRef, useCallback, useEffect } from 'react'
import { Button, Tabs, Spin, message } from 'antd'
import {
  ReloadOutlined,
  UploadOutlined,
  PictureOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import { useTheme } from '../../hooks/useTheme'
import { getAlgorithmList, getAlgorithm } from '../../utils/algorithms'
import type { LabPixel, ExtractParams, ExtractResult } from '../../utils/algorithms/types'
import { extractPixelsFromImage, pixelsToLab } from '../../utils/algorithms/colorSpace'
import { computeDynamicK } from '../../utils/algorithms/dynamicK'
import ColorThiefPanel from './ColorThiefPanel'
import KMeansPanel from './KMeansPanel'
import PaletteGrid from './PaletteGrid'
import DyeMatchView from './DyeMatchView'

/* ===== 工具 ===== */

function loadImageFromFile(file: File): Promise<{ img: HTMLImageElement; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => resolve({ img, dataUrl: e.target!.result as string })
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target!.result as string
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

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

/* ===== 主组件 ===== */

function ExtractPage() {
  useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 上传状态
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // 算法选择
  const algorithms = getAlgorithmList()
  const [algorithmKey, setAlgorithmKey] = useState(algorithms[0]?.key ?? 'kmeans')

  // 控制参数
  const [dynamicK, setDynamicK] = useState(true)
  const [initialK, setInitialK] = useState(10)
  const [mergeMode, setMergeMode] = useState<'target' | 'threshold'>('target')
  const [targetCount, setTargetCount] = useState(8)
  const [mergeThreshold, setMergeThreshold] = useState(10)
  const [filterExtreme, setFilterExtreme] = useState(false)
  const [quality, setQuality] = useState(10)
  const [includeMetallic, setIncludeMetallic] = useState(false)

  // 动态定K信息
  const [histogramInfo, setHistogramInfo] = useState<{ k: number; m: number } | null>(null)

  // 缓存
  const cachedLabPixels = useRef<LabPixel[] | null>(null)
  const cachedImageRef = useRef<HTMLImageElement | null>(null)

  // 结果
  const [result, setResult] = useState<ExtractResult | null>(null)

  // 视图切换
  const [viewMode, setViewMode] = useState<'palette' | 'dye'>('dye')

  /* ---------- 图片处理 ---------- */

  const runExtraction = useCallback(async (
    labPixels: LabPixel[],
    effectiveK: number,
  ) => {
    const algo = getAlgorithm(algorithmKey)
    if (!algo) return

    const params: ExtractParams = {
      initialK: effectiveK,
      mergeThreshold,
      targetCount: mergeMode === 'target' ? targetCount : 0,
      filterExtreme,
      enableMerge: true,
      quality,
    }

    try {
      const res = algo.fn(labPixels, params, cachedImageRef.current ?? undefined)
      setResult(res)
      const pixelCount = res.palette.reduce((s, c) => s + c.count, 0)
      const logParts = [
        `基于 ${pixelCount.toLocaleString()} 像素`,
        `K=${effectiveK}`,
        `RGB 聚类 ${res.initialClusters} 簇`,
      ]
      if (res.mergedCount > 0) {
        logParts.push(`LAB 合并后 ${res.finalClusters} 种颜色`)
        if (res.finalThreshold > 0) logParts.push(`末次 ΔE=${res.finalThreshold.toFixed(1)}`)
      } else {
        logParts.push(`最终 ${res.finalClusters} 种颜色`)
      }
      console.log(`[色彩提取] ${logParts.join(' · ')}`)
    } catch (err) {
      console.error(err)
      message.error('颜色提取出错')
    }
  }, [algorithmKey, mergeThreshold, targetCount, mergeMode, filterExtreme, quality, setResult])

  const processImage = useCallback(async (img: HTMLImageElement, dataUrl: string) => {
    setLoading(true)
    setResult(null)
    setImageDataUrl(dataUrl)
    setImageLoaded(true)
    cachedImageRef.current = img

    try {
      if (algorithmKey === 'colorthief') {
        const labPixels: LabPixel[] = []
        cachedLabPixels.current = labPixels
        await runExtraction(labPixels, 0)
        setLoading(false)
        return
      }

      const pixels = extractPixelsFromImage(img, 40000)

      let k = initialK
      let info: { k: number; m: number } | null = null
      if (dynamicK) {
        info = computeDynamicK(pixels)
        k = info.k
        setHistogramInfo(info)
      } else {
        setHistogramInfo(null)
      }

      if (pixels.length < k) {
        message.warning(`像素不足 (${pixels.length})，请降低 K 值`)
        setLoading(false)
        return
      }

      const labPixels = pixelsToLab(pixels)
      cachedLabPixels.current = labPixels

      await runExtraction(labPixels, k)
    } catch (err) {
      console.error(err)
      message.error('图片处理出错，请重试')
    } finally {
      setLoading(false)
    }
  }, [algorithmKey, dynamicK, initialK, runExtraction, setLoading, setResult, setImageDataUrl, setImageLoaded, setHistogramInfo])

  const handleExtract = useCallback(async () => {
    if (!cachedImageRef.current) {
      message.info('请先上传图片')
      return
    }

    setLoading(true)
    setResult(null)

    if (algorithmKey === 'colorthief') {
      const labPixels: LabPixel[] = []
      cachedLabPixels.current = labPixels
      await runExtraction(labPixels, 0)
      setLoading(false)
      return
    }

    let k = initialK
    let info: { k: number; m: number } | null = null
    if (dynamicK) {
      const img = cachedImageRef.current
      const pixels = extractPixelsFromImage(img, 40000)
      info = computeDynamicK(pixels)
      k = info.k
      setHistogramInfo(info)
      const labPixels = pixelsToLab(pixels)
      cachedLabPixels.current = labPixels
    } else {
      setHistogramInfo(null)
    }

    await runExtraction(cachedLabPixels.current!, k)
    setLoading(false)
  }, [algorithmKey, dynamicK, initialK, runExtraction, setLoading, setResult, setHistogramInfo])

  /* ---------- 文件上传 ---------- */

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.warning('请上传图片文件')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      message.warning('文件过大 (≤50MB)')
      return
    }
    setLoading(true)
    try {
      const { img, dataUrl } = await loadImageFromFile(file)
      await processImage(img, dataUrl)
    } catch {
      message.error('图片加载失败')
      setLoading(false)
    }
  }, [processImage, setLoading])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }, [handleFile])

  /* ---------- 重置 ---------- */

  const handleReset = useCallback(() => {
    cachedLabPixels.current = null
    cachedImageRef.current = null
    setImageDataUrl(null)
    setImageLoaded(false)
    setResult(null)
    setHistogramInfo(null)
    setViewMode('dye')
    setDynamicK(true)
    setInitialK(10)
    setMergeMode('target')
    setTargetCount(8)
    setMergeThreshold(10)
    setFilterExtreme(false)
    setQuality(10)
    setIncludeMetallic(false)
    setAlgorithmKey(algorithms[0]?.key ?? 'colorthief')
    message.success('已重置')
  }, [algorithms, setImageDataUrl, setImageLoaded, setResult, setHistogramInfo, setViewMode, setDynamicK, setInitialK, setMergeMode, setTargetCount, setMergeThreshold, setFilterExtreme, setQuality, setIncludeMetallic, setAlgorithmKey])

  /* ---------- 参数变更自动重新提取 ---------- */

  const autoExtract = useCallback(() => {
    if (algorithmKey === 'colorthief' || !cachedLabPixels.current) return
    let k = initialK
    if (dynamicK && histogramInfo) {
      k = histogramInfo.k
    }
    runExtraction(cachedLabPixels.current, k)
  }, [algorithmKey, dynamicK, initialK, histogramInfo, runExtraction])

  useEffect(() => {
    if (cachedLabPixels.current && algorithmKey !== 'colorthief') {
      autoExtract()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergeMode, filterExtreme])

  /* ---------- 复制 ---------- */

  const copyColor = useCallback((hex: string) => {
    message.success(`已复制 ${hex}`)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hex).catch(() => fallbackCopy(hex))
    } else {
      fallbackCopy(hex)
    }
  }, [])

  /* ---------- 渲染 ---------- */

  return (
    <div className="extract-page">
      <div className="extract-container">
        {/* ===== 上传区域 ===== */}
        <div
          className={`extract-upload-area${imageLoaded ? ' has-image' : ''}${dragOver ? ' drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragEnter={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={e => { e.preventDefault(); setDragOver(false) }}
        >
          {imageLoaded && imageDataUrl ? (
            <div className="extract-preview-container">
              <img src={imageDataUrl} alt="预览" className="extract-preview-img" />
              <button
                className="extract-change-btn"
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
              >
                <PictureOutlined /> 更换图片
              </button>
            </div>
          ) : (
            <>
              <UploadOutlined className="extract-upload-icon" />
              <p className="extract-upload-text">点击或拖放图片到此处</p>
              <p className="extract-upload-hint">JPG / PNG / WebP</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </div>

        {/* ===== 控制面板 ===== */}
        <div className="extract-controls">
          {/* 算法切换 — Tabs */}
          <Tabs
            activeKey={algorithmKey}
            onChange={v => { setAlgorithmKey(v as string); setResult(null) }}
            size="small"
            items={[
              {
                key: 'colorthief',
                label: algorithms.find(a => a.key === 'colorthief')?.name ?? 'MMCQ（稳定）',
                children: (
                  <ColorThiefPanel
                    targetCount={targetCount}
                    quality={quality}
                    includeMetallic={includeMetallic}
                    onTargetCountChange={setTargetCount}
                    onQualityChange={setQuality}
                    onIncludeMetallicChange={setIncludeMetallic}
                    onExtract={handleExtract}
                  />
                ),
              },
              {
                key: 'kmeans',
                label: algorithms.find(a => a.key === 'kmeans')?.name ?? 'K-Means',
                children: (
                  <KMeansPanel
                    dynamicK={dynamicK}
                    initialK={initialK}
                    mergeMode={mergeMode}
                    targetCount={targetCount}
                    mergeThreshold={mergeThreshold}
                    filterExtreme={filterExtreme}
                    includeMetallic={includeMetallic}
                    histogramInfo={histogramInfo}
                    onDynamicKChange={v => { setDynamicK(v); if (!v) setHistogramInfo(null) }}
                    onInitialKChange={setInitialK}
                    onMergeModeChange={setMergeMode}
                    onTargetCountChange={setTargetCount}
                    onMergeThresholdChange={setMergeThreshold}
                    onFilterExtremeChange={setFilterExtreme}
                    onIncludeMetallicChange={setIncludeMetallic}
                    onRunExtraction={(k) => {
                      if (cachedLabPixels.current) runExtraction(cachedLabPixels.current, k)
                    }}
                    onAutoExtract={autoExtract}
                  />
                ),
              },
            ]}
          />

          {/* 操作按钮 */}
          <div className="extract-actions">
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleExtract}
                loading={loading}
              >
                取色
              </Button>
            {result && result.palette.length > 0 && (
              <Button
                icon={<SwapOutlined />}
                onClick={() => setViewMode(v => v === 'palette' ? 'dye' : 'palette')}
              >
                {viewMode === 'palette' ? '染剂匹配' : '调色板'}
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </div>
        </div>

        {/* ===== 结果展示 ===== */}
        {result && result.palette.length > 0 && (
          viewMode === 'palette'
            ? <PaletteGrid palette={result.palette} onCopyColor={copyColor} />
            : <DyeMatchView palette={result.palette} includeMetallic={includeMetallic} />
        )}
      </div>

      {/* 加载遮罩 */}
      <Spin spinning={loading} fullscreen description="处理中..." />
    </div>
  )
}

export default ExtractPage
