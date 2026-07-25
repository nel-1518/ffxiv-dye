import { useEffect } from 'react'
import type { SchemeDiamond } from '../../types/scheme'
import { useCircleLayout } from '../../hooks/useCircleLayout'
import BlendCircle from './BlendCircle'

interface CirclesStageProps {
  diamonds: SchemeDiamond[]
}

function CirclesStage({ diamonds }: CirclesStageProps) {
  const { layout, regenerate } = useCircleLayout()

  useEffect(() => {
    regenerate()
  }, [diamonds, regenerate])

  return (
    <div className="circles-stage">
      {diamonds.slice(0, 5).map((d, i) => {
        const l = layout[i] ?? { x: 55, y: 55, d: 50 }
        return (
          <BlendCircle
            key={i}
            hex={d.hex}
            name={d.name}
            cx={l.x}
            cy={l.y}
            d={l.d}
            index={i}
          />
        )
      })}
    </div>
  )
}

export default CirclesStage
