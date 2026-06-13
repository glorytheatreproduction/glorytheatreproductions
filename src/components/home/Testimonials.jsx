import { useCms } from '../../context/CmsContext'

export default function Testimonials() {
  const { testimonials } = useCms()

  return (
    <section className="section-dark bg-void py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map(({ quote, name, role }, index) => (
            <blockquote
              key={name}
              data-reveal
              data-reveal-delay={String((index % 3) + 1)}
              className="border border-border-dark p-8"
            >
              <p
                className="font-heading italic text-cream text-xl leading-relaxed mb-6"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                &ldquo;{quote}&rdquo;
              </p>
              <footer>
                <cite className="not-italic font-display text-gold block">{name}</cite>
                <span className="font-mono text-[10px] uppercase tracking-widest text-cream/70">{role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
