import { useEffect, useRef } from 'react'

export function useTouchSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 35,
) {
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const hasMoved = useRef(false)

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      hasMoved.current = false
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
      const dy = (e.changedTouches[0]?.clientY ?? touchStartY.current) - touchStartY.current
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      if (Math.max(absDx, absDy) > threshold && absDx > absDy) {
        if (dx < -threshold) {
          onSwipeLeft()
        } else if (dx > threshold) {
          onSwipeRight()
        }
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onSwipeLeft, onSwipeRight, threshold])
}
