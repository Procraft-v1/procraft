import logoMark from '../assets/brand/procraft-logo-mark-transparent.png';

export function LogoMark({ size = 36, className, alt = 'Procraft' }) {
  return (
    <img
      src={logoMark}
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
