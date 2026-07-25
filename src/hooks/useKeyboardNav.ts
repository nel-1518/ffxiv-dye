import { useEffect } from 'react'

export function useKeyboardNav(
  onSwitchNext: () => void,
  onSwitchPrev: () => void,
  onSwitchTo: (index: number) => void,
  schemeCount: number,
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 忽略输入框中的按键
      if (
        e.target instanceof HTMLElement &&
        (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)
      ) {
        return
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        onSwitchNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        onSwitchPrev()
      } else if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1
        if (idx < schemeCount) {
          e.preventDefault()
          onSwitchTo(idx)
        }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onSwitchNext, onSwitchPrev, onSwitchTo, schemeCount])
}
