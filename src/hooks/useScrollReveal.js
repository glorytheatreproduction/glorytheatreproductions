import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useCms } from '../context/CmsContext'

function isInViewport(el) {
  const rect = el.getBoundingClientRect()
  const viewHeight = window.innerHeight || document.documentElement.clientHeight
  return rect.top < viewHeight * 0.92 && rect.bottom > 0
}

function observeRevealElements(observer) {
  document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach((el) => {
    if (isInViewport(el)) {
      el.classList.add('is-revealed')
      return
    }
    observer.observe(el)
  })
}

/**
 * Reveal elements marked with [data-reveal] as they enter the viewport.
 * Re-scans when the route, CMS load, or extra deps change so async/filtered
 * content is not left invisible (opacity: 0).
 */
export function useScrollReveal(...extraDeps) {
  const { pathname } = useLocation()
  const { loading } = useCms()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -2% 0px' }
    )

    const scan = () => observeRevealElements(observer)

    const frame = requestAnimationFrame(scan)
    const timer = window.setTimeout(scan, 120)
    const lateTimer = window.setTimeout(scan, 400)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      window.clearTimeout(lateTimer)
      observer.disconnect()
    }
  }, [pathname, loading, ...extraDeps])
}
