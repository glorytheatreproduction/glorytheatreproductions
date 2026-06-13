import { useMemo } from 'react'
import { useCms } from '../context/CmsContext'
import { getEventById } from '../services/cms/events'

export function useResolvedEvent(eventId) {
  const { events, loading } = useCms()
  const event = useMemo(() => getEventById(events, eventId), [events, eventId])
  return { event, loading, ready: !loading }
}

export function splitEventDescription(text) {
  if (!text?.trim()) return []
  return text.split(/\n+/).map((part) => part.trim()).filter(Boolean)
}
