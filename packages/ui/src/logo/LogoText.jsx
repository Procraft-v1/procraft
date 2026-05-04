export function LogoText({ color = '#0D1B2A', size = 24, className }) {
  return (
    <span
      className={className}
      style={{
        color,
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      Procraft
    </span>
  );
}
