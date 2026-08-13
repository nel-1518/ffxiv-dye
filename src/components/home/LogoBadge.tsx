import { useCallback, useRef } from 'react'
import type { SchemeDiamond } from '../../types/scheme'
import CirclesStage from './CirclesStage'

interface LogoBadgeProps {
  diamonds: SchemeDiamond[]
  onSwitch: () => void
}

function LogoBadge({ diamonds, onSwitch }: LogoBadgeProps) {
  const badgeRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(
    () => {
      onSwitch()

      // 触觉反馈
      if (badgeRef.current) {
        badgeRef.current.style.boxShadow =
          '0 1px 6px rgba(0,0,0,0.04), inset 0 0 0 5px rgba(255,255,255,0.5), 0 0 0 0px var(--color-ring)'
        setTimeout(() => {
          if (badgeRef.current) {
            badgeRef.current.style.boxShadow =
              '0 3px 18px rgba(0, 0, 0, 0.07), inset 0 0 0 5px rgba(255,255,255,0.5)'
          }
        }, 180)
      }
    },
    [onSwitch],
  )

  return (
    <div className="logo-badge-wrapper" onClick={handleClick} title="点击切换配色">
      <div className="logo-badge" ref={badgeRef}>
        <CirclesStage diamonds={diamonds} />
      </div>
    </div>
  )
}

export default LogoBadge
