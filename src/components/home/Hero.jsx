import GoldButton from '../ui/GoldButton'
import OutlineButton from '../ui/OutlineButton'
import { events } from '../../data/events'

const featured = events.find((e) => e.featured) || events[0]

export default function Hero() {
  return (
    <section className="section-dark relative min-h-screen flex items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1503095396549-807759245b35?w=1920')",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(10,8,4,0.82) 0%, rgba(10,8,4,0.68) 45%, rgba(10,8,4,0.94) 100%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 w-full">
        <p
          className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold-light mb-8"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          / Drama · Choreography · Spoken Word
        </p>

        <h1
          className="font-display font-black text-cream leading-[0.95] mb-8"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span className="hero-line block text-[56px] md:text-[100px] lg:text-[120px]">MOVEMENT.</span>
          <span className="hero-line block text-[56px] md:text-[100px] lg:text-[120px]">
            STORY. <span className="text-gold">STAGE.</span>
          </span>
        </h1>

        <p
          className="font-heading italic text-cream/95 text-lg md:text-[22px] max-w-xl mb-10 leading-relaxed"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          A collective of creative youth, proclaiming CHRIST through the arts.
        </p>

        <div className="hero-cta flex flex-wrap gap-4">
          <GoldButton to={`/events/${featured?.id || 'christian-creatives-workshop'}/tickets`}>Buy Tickets</GoldButton>
          <OutlineButton to="/events">See Shows</OutlineButton>
        </div>

        <p
          className="absolute bottom-8 left-6 font-mono text-[11px] text-cream/80 uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Accra, Ghana · Est. 2013
        </p>
      </div>
    </section>
  )
}
