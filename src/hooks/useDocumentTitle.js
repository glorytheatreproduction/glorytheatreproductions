import { useEffect } from 'react'

export function useDocumentTitle(title, description) {
  useEffect(() => {
    document.title = title
    if (description) {
      const meta = document.querySelector('meta[name="description"]')
      if (meta) meta.setAttribute('content', description)
    }
  }, [title, description])
}
