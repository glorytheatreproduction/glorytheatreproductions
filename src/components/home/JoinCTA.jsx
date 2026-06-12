import { useState } from 'react'

export default function JoinCTA() {
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
        <h2
          className="font-display text-4xl md:text-6xl text-cream leading-tight mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          JOIN THE COLLECTIVE
        </h2>
        <p className="text-cream/80 text-base mb-6 max-w-lg mx-auto">
          Be part of a community of young creatives using the arts to proclaim Christ.
          Subscribe for updates on auditions, workshops, and performances.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="flex-1 bg-paper text-ink px-4 py-2.5 text-xs placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <button
            type="submit"
            className="bg-gold text-void px-6 py-2.5 text-xs font-medium hover:bg-gold-muted transition-colors"
          >
            Subscribe
          </button>
        </form>

        {submitted && (
          <p className="text-cream/80 text-sm mt-4">Welcome to the collective!</p>
        )}
      </div>
    </section>
  )
}
