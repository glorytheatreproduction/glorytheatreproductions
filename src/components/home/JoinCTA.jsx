import { useState } from 'react'
import { useCms } from '../../context/CmsContext'

export default function JoinCTA() {
  const { homeJoin } = useCms()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email && email.includes('@')) {
      setSubmitted(true)
      setEmail('')
    }
  }

  return (
    <section id="join" className="section-dark relative bg-burgundy py-14 md:py-20">
      <div className="max-w-4xl mx-auto px-6 text-center" data-reveal>
        <p
          className="font-mono text-[10px] uppercase tracking-widest text-cream/70 mb-3"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {homeJoin.label}
        </p>
        <h2
          className="font-display text-4xl md:text-6xl text-cream leading-tight mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {homeJoin.title}
        </h2>
        <p className="text-cream/80 text-base mb-6 max-w-lg mx-auto">
          {homeJoin.description}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={homeJoin.emailPlaceholder}
            required
            className="flex-1 bg-paper text-ink px-4 py-2.5 text-xs placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <button
            type="submit"
            className="bg-gold text-void px-6 py-2.5 text-xs font-medium hover:bg-gold-muted transition-colors"
          >
            {homeJoin.buttonLabel}
          </button>
        </form>

        {submitted ? (
          <p className="text-cream/80 text-sm mt-4">Welcome to the collective!</p>
        ) : null}
      </div>
    </section>
  )
}
