const LOGO = {
  onDark: '/images/logo/glory-theatre-logo-dark.png',
  onLight: '/images/logo/glory-theatre-logo-light.png',
}

/** @param {'on-dark' | 'on-light'} variant — background the logo sits on */
export default function SiteLogo({ variant = 'on-light', className = '' }) {
  const src = variant === 'on-dark' ? LOGO.onDark : LOGO.onLight

  return (
    <img
      src={src}
      alt="Glory Theatre Productions"
      className={`h-9 w-auto max-w-[min(240px,62vw)] object-contain object-left md:h-10 md:max-w-[280px] ${className}`}
      width={280}
      height={40}
      decoding="async"
    />
  )
}
