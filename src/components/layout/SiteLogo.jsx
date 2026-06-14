const LOGO = {
  /** Light/cream text — for dark backgrounds (footer, hero nav) */
  onDark: '/images/logo/glory-theatre-logo-dark.png',
  /** Dark text, transparent — for light backgrounds (CMS, scrolled nav) */
  onLight: '/images/logo/glory-theatre-logo-light.png',
}

/** @param {'on-dark' | 'on-light'} variant — background the logo sits on */
export default function SiteLogo({ variant = 'on-light', className = '' }) {
  const src = variant === 'on-dark' ? LOGO.onDark : LOGO.onLight

  return (
    <img
      src={src}
      alt="Glory Theatre Productions"
      className={`h-10 w-auto max-w-[min(300px,72vw)] object-contain object-left md:h-11 md:max-w-[340px] ${className}`}
      width={340}
      height={128}
      decoding="async"
    />
  )
}
