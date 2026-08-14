import type { ReactElement } from 'react'

interface ColorDotProps {
  hex: string
  name: string
}

function ColorDot({ hex, name }: ColorDotProps): ReactElement {
  return (
    <span
      className="color-dot color-tip"
      style={{ backgroundColor: hex }}
      data-tip={`${name} ${hex}`}
    />
  )
}

export default ColorDot
