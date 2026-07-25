import { useCallback } from 'react'

interface ColorDotProps {
  hex: string
  name: string
  dye: string
  onOpenWiki: (dye: string) => void
}

function ColorDot({ hex, name, dye, onOpenWiki }: ColorDotProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onOpenWiki(dye)
    },
    [dye, onOpenWiki],
  )

  return (
    <span
      className="color-dot"
      style={{ backgroundColor: hex }}
      data-name={name}
      title={`${name} (${hex})`}
      onClick={handleClick}
    />
  )
}

export default ColorDot
