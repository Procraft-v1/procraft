import { LogoMark } from './LogoMark.jsx';
import { LogoText } from './LogoText.jsx';

export function Logo({ size = 36, showText = true, textColor, className }) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <LogoMark size={size} />
      {showText ? <LogoText color={textColor} size={Math.max(18, Math.round(size * 0.67))} /> : null}
    </span>
  );
}
