import type { ReactElement } from 'react'

interface ColorDotProps {
  hex: string
  name: string
}

function ColorDot({ hex, name }: ColorDotProps): ReactElement {
  return (
    <span
      className="color-dot"
      style={{ backgroundColor: hex }}
      data-name={name}
      title={`${name} (${hex})`}
    />
  )
}

export default ColorDot
