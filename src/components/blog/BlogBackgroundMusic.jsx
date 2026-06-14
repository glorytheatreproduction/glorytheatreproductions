import { useCallback, useEffect, useRef, useState } from 'react'
import { resolveCmsImageUrl } from '../../lib/cmsImage'

export default function BlogBackgroundMusic({ url, title = '', artist = '' }) {
  const audioRef = useRef(null)
  const userPausedRef = useRef(false)
  const playingRef = useRef(false)
  const resolvedUrl = resolveCmsImageUrl(url)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const [needsInteraction, setNeedsInteraction] = useState(false)

  const tryPlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || userPausedRef.current) return false

    try {
      await audio.play()
      setNeedsInteraction(false)
      return true
    } catch {
      setNeedsInteraction(true)
      return false
    }
  }, [])

  useEffect(() => {
    userPausedRef.current = false
    setPlaying(false)
    setReady(false)
    setNeedsInteraction(false)
  }, [resolvedUrl])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !resolvedUrl) return undefined

    audio.volume = 0.32
    audio.loop = true

    const onCanPlay = () => {
      setReady(true)
      if (!userPausedRef.current) tryPlay()
    }
    const onPlay = () => {
      playingRef.current = true
      setPlaying(true)
    }
    const onPause = () => {
      playingRef.current = false
      setPlaying(false)
    }

    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    const unlockOnGesture = () => {
      if (userPausedRef.current || playingRef.current) return
      tryPlay()
    }

    document.addEventListener('pointerdown', unlockOnGesture, { passive: true })
    document.addEventListener('keydown', unlockOnGesture)

    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      setReady(true)
      if (!userPausedRef.current) tryPlay()
    }

    return () => {
      audio.pause()
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      document.removeEventListener('pointerdown', unlockOnGesture)
      document.removeEventListener('keydown', unlockOnGesture)
    }
  }, [resolvedUrl, tryPlay])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      userPausedRef.current = true
      audio.pause()
      return
    }

    userPausedRef.current = false
    await tryPlay()
  }, [playing, tryPlay])

  if (!resolvedUrl) return null

  const label = title || 'Background music'
  const meta = artist ? `${label} · ${artist}` : label
  const statusLabel = playing
    ? 'Now playing'
    : needsInteraction
      ? 'Tap play to start'
      : ready
        ? 'Soundtrack'
        : 'Loading…'

  return (
    <>
      <audio ref={audioRef} src={resolvedUrl} preload="auto" playsInline autoPlay />

      <div
        className="fixed bottom-6 left-1/2 z-40 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2"
        role="region"
        aria-label="Post background music"
      >
        <div className="flex items-center gap-3 rounded-full border border-cream/15 bg-void/90 px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <button
            type="button"
            onClick={togglePlay}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
              playing ? 'bg-gold text-void' : 'bg-cream/10 text-cream hover:bg-cream/20'
            }`}
            aria-label={playing ? 'Pause background music' : 'Play background music'}
            aria-pressed={playing}
          >
            {playing ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg className="h-4 w-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5.14v14.72a1 1 0 0 0 1.5.86l11.04-7.36a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
              </svg>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p
              className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-gold-light"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {statusLabel}
            </p>
            <p className="truncate text-sm text-cream">{meta}</p>
          </div>

          {playing ? (
            <span className="flex shrink-0 gap-0.5" aria-hidden>
              {[0, 1, 2].map((bar) => (
                <span
                  key={bar}
                  className="inline-block w-0.5 rounded-full bg-gold animate-pulse"
                  style={{
                    height: `${10 + bar * 4}px`,
                    animationDelay: `${bar * 120}ms`,
                  }}
                />
              ))}
            </span>
          ) : null}
        </div>
      </div>
    </>
  )
}
