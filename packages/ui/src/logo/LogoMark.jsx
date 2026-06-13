import logoMark from '../assets/brand/procraft-logo-mark-transparent.png';

// Vite resolves the import to a URL string; Next.js resolves it to a
// StaticImageData object whose URL lives on `.src`.
const logoMarkUrl = typeof logoMark === 'string' ? logoMark : logoMark?.src;

export function LogoMark({ size = 36, className, alt = 'Procraft' }) {
  return (
    <img
      src={logoMarkUrl}
      alt={alt}
      className={className}
      width={size}
      height={size}
      style={{
        display: 'block',
        width: size,
        height: size,
        objectFit: 'contain',
      }}
    />
  );
}
