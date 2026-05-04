/** Returns subdomain label before public suffix (profiles host naming). */

export function getSubdomain(hostname) {
  if (!hostname || typeof hostname !== 'string') return '';

  const clean = hostname.split(':')[0].toLowerCase();
  const segments = clean.split('.');

  if (segments.length < 3) return '';

  return segments[0] || '';
}
