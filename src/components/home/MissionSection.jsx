import SectionLabel from '../ui/SectionLabel'
import { useCms } from '../../context/CmsContext'

export default function MissionSection() {
  const { homeMission } = useCms()

  return (
    <section className="bg-paper py-24 md:py-32 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div data-reveal>
            <SectionLabel className="mb-8">{homeMission.label}</SectionLabel>
            <blockquote
              className="font-heading italic text-ink text-3xl md:text-[48px] leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              &ldquo;{homeMission.quote}&rdquo;
            </blockquote>
          </div>

          <div data-reveal data-reveal-delay="1" className="md:pt-12">
            {homeMission.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-ink-muted text-base leading-relaxed mb-6 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
