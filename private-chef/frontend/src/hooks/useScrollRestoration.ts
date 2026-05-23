import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router'

// Module-scoped map so it survives component re-mounts within a single SPA session.
const scrollPositions = new Map<string, number>()

/**
 * Browser-style scroll restoration for SPA navigation.
 *
 * - On PUSH/REPLACE: scroll to top (entering a new route).
 * - On POP (back/forward): restore the scroll Y saved for that history key.
 *
 * Because list pages often hydrate data asynchronously and the page height grows
 * after mount, restoring tries multiple frames until either the target Y is
 * reached or we've waited long enough.
 */
export function useScrollRestoration() {
  const location = useLocation()
  const navType = useNavigationType()
  const key = location.key

  // Continuously save scrollY for the current location key.
  useEffect(() => {
    const save = () => scrollPositions.set(key, window.scrollY)
    window.addEventListener('scroll', save, { passive: true })
    return () => {
      // Capture one last time before navigation away.
      save()
      window.removeEventListener('scroll', save)
    }
  }, [key])

  // Restore (POP) or reset (PUSH/REPLACE) on every location change.
  useEffect(() => {
    if (navType === 'POP') {
      const target = scrollPositions.get(key) ?? 0
      let tries = 0
      const restore = () => {
        window.scrollTo(0, target)
        // Page might still be hydrating — keep trying for up to ~50 frames.
        if (window.scrollY < target - 1 && tries < 50) {
          tries++
          requestAnimationFrame(restore)
        }
      }
      requestAnimationFrame(restore)
    } else {
      window.scrollTo(0, 0)
      scrollPositions.set(key, 0)
    }
  }, [key, navType])
}
