interface BlendCircleProps {
  hex: string
  name: string
  cx: number
  cy: number
  d: number
  index: number
}

function BlendCircle({ hex, name, cx, cy, d, index }: BlendCircleProps) {
  return (
    <div
      className={`blend-circle c${index}`}
      style={{
        left: cx - d / 2 + '%',
        top: cy - d / 2 + '%',
        width: d + '%',
        height: d + '%',
        backgroundColor: hex,
      }}
      data-name={name}
    />
  )
}

export default BlendCircle
