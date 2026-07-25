import type { SchemeDiamond } from '../../types/scheme'
import ColorDot from './ColorDot'

interface ColorStripProps {
  diamonds: SchemeDiamond[]
  dyeMap: Record<string, string>
  onOpenWiki: (dye: string) => void
}

function ColorStrip({ diamonds, dyeMap, onOpenWiki }: ColorStripProps) {
  return (
    <div className="color-strip">
      {diamonds.map((d, i) => (
        <ColorDot
          key={i}
          hex={d.hex}
          name={d.name}
          dye={dyeMap[d.hex] ?? d.name}
          onOpenWiki={onOpenWiki}
        />
      ))}
    </div>
  )
}

export default ColorStrip
