import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useCms } from '../context/CmsContext'

function observeRevealElements(observer) {
  document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach((el) => {
    observer.observe(el)
  })
}

/**
 * Reveal elements marked with [data-reveal] as they enter the viewport.
 * Re-scans when the route or CMS content finishes loading so async content
 * is not left invisible (opacity: 0).
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
      { threshold: 0.1, rootMargin: '0px 0px -5% 0px' }
    )

    const scan = () => observeRevealElements(observer)

    const frame = requestAnimationFrame(scan)
    const timer = window.setTimeout(scan, 150)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [pathname, loading, ...extraDeps])
}
