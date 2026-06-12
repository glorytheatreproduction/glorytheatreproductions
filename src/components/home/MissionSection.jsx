import SectionLabel from '../ui/SectionLabel'

export default function MissionSection() {
  return (
    <section className="bg-paper py-24 md:py-32 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div data-reveal>
            <SectionLabel className="mb-8">Our Mission</SectionLabel>
            <blockquote
              className="font-heading italic text-ink text-3xl md:text-[48px] leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              &ldquo;Representing and proclaiming CHRIST through our arts.&rdquo;
            </blockquote>
          </div>

          <div data-reveal data-reveal-delay="1" className="md:pt-12">
            <p className="text-ink-muted text-base leading-relaxed mb-6">
              Glory Theatre Productions is a Christian youth creative collective based in Accra, Ghana.
              We use drama, choreography, and spoken word as forms of worship and proclamation —
              bringing the gospel to life through the performing arts.
            </p>
            <p className="text-ink-muted text-base leading-relaxed mb-6">
              Founded in 2013, our collective brings together young artists who are passionate about
              using their God-given talents to inspire, challenge, and transform audiences through
              powerful, intentional storytelling.
            </p>
            <p className="text-ink-muted text-base leading-relaxed">
              Every production is an act of worship — a sacred space where movement, story, and stage
              converge to proclaim the glory of Christ.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
