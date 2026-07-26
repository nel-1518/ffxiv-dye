interface ColorDotProps {
  hex: string
  name: string
  dye: string
}

function ColorDot({ hex, name, dye }: ColorDotProps) {
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
