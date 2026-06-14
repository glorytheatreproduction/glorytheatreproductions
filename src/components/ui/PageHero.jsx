import { Link } from 'react-router-dom'
import SectionLabel from './SectionLabel'
import { resolveCmsImageUrl } from '../../lib/cmsImage'

const titleSizes = {
  default: 'text-5xl md:text-7xl mb-4',
  detail: 'text-4xl md:text-6xl lg:text-7xl mb-6 max-w-4xl',
}

export default function PageHero({
  label,
  title,
  subtitle,
  backLink,
  image,
  children,
  titleSize = 'default',
  narrow = false,
}) {
  const contentWidth = narrow ? 'max-w-4xl' : 'max-w-7xl'
  const heroImage = resolveCmsImageUrl(image)

  return (
    <section className="section-dark relative bg-void min-h-[40vh] flex items-end">
      {heroImage ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, var(--color-void) 20%, rgba(10,8,4,0.92) 100%)',
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center top, rgba(201,168,76,0.05) 0%, var(--color-void) 60%)',
          }}
        />
      )}

      <div className={`relative z-10 ${contentWidth} mx-auto px-6 pt-32 pb-16 w-full`}>
        {backLink && (
          <Link
            to={backLink.to}
            className="font-mono text-[10px] uppercase tracking-widest text-cream/85 hover:text-gold transition-colors mb-8 inline-block"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            ← {backLink.label}
          </Link>
        )}

        {label && (
          <SectionLabel variant="dark" className="mb-6">
            {label}
          </SectionLabel>
        )}

        <h1
          className={`font-display text-cream leading-tight ${titleSizes[titleSize]}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h1>

        {subtitle && <div className="mb-0">{subtitle}</div>}

        {children}
      </div>
    </section>
  )
}
