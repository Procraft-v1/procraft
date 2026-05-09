/**
 * Vite-compatible env accessors. Prefer `import.meta.env` in apps; helpers keep packages consistent.
 * Never put secrets in Vite-prefixed env vars.
 */

function readVite(key, fallback = '') {
  if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
    return import.meta.env[key] ?? fallback;
  }
  if (typeof process !== 'undefined' && process.env && key in process.env) {
    return process.env[key] ?? fallback;
  }
  return fallback;
}

export function getApiBaseUrl() {
  return readVite('VITE_API_URL', '/api');
}

export function getUploadsBaseUrl() {
  return readVite('VITE_UPLOADS_URL', '/uploads');
}

export function resolveAssetUrl(value) {
  if (!value) {
    return value;
  }

  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }

  if (!value.startsWith('/uploads')) {
    return value;
  }

  const baseUrl = getUploadsBaseUrl().replace(/\/$/, '');
  const path = value.startsWith('/') ? value : `/${value}`;
  return `${baseUrl}${path.replace(/^\/uploads/, '')}`;
}

export function getAppName() {
  return readVite('VITE_APP_NAME', 'Procraft');
}
