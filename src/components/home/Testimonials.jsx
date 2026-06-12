import SectionLabel from '../ui/SectionLabel'
import { testimonials } from '../../data/blog'

export default function Testimonials() {
  return (
    <section className="bg-paper py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div data-reveal>
          <SectionLabel className="mb-12">What People Say</SectionLabel>
        </div>

        <div className="testimonials-scroll" data-reveal data-reveal-delay="1">
          {testimonials.map((t) => (
            <blockquote key={t.name} className="p-8">
              <span
                className="font-display text-[80px] leading-none text-gold block mb-4"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                &ldquo;
              </span>
              <p
                className="font-heading italic text-ink text-lg md:text-xl leading-relaxed mb-8"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {t.quote}
              </p>
              <footer>
                <p
                  className="font-mono text-xs uppercase tracking-widest text-ink-muted"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {t.name}
                </p>
                <p
                  className="font-mono text-[10px] uppercase tracking-widest text-gold-muted mt-1"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {t.role}
                </p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
