/**
 * Bundler-agnostic env accessors shared by Vite (legacy) and Next.js apps.
 *
 * Resolution order per key:
 *   1. Vite — `import.meta.env.VITE_*` (statically defined by Vite).
 *   2. Next.js client bundles — `process.env.NEXT_PUBLIC_*` literals below are
 *      inlined at build time (next.config maps VITE_* → NEXT_PUBLIC_* so the
 *      root `.env` keeps its existing names).
 *   3. Node runtime (Next SSR / scripts) — raw `process.env` lookup, so the
 *      same VITE_* names from the root `.env` keep working server-side.
 * Never put secrets in any of these vars.
 */

/* eslint-disable no-undef */

// NOTE: these MUST stay literal member expressions — Next.js (webpack
// DefinePlugin) only inlines exact `process.env.NEXT_PUBLIC_X` references.
function readNextPublic(key) {
  if (typeof process === 'undefined' || !process.env) {
    return undefined;
  }

  switch (key) {
    case 'VITE_API_URL':
      return process.env.NEXT_PUBLIC_API_URL;
    case 'VITE_UPLOADS_URL':
      return process.env.NEXT_PUBLIC_UPLOADS_URL;
    case 'VITE_APP_NAME':
      return process.env.NEXT_PUBLIC_APP_NAME;
    default:
      return undefined;
  }
}

function readVite(key, fallback = '') {
  if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
    return import.meta.env[key] ?? fallback;
  }

  const inlined = readNextPublic(key);
  if (inlined !== undefined && inlined !== '') {
    return inlined;
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

/**
 * Absolute API base for server-side fetches (Next SSR). Containers may point
 * this at the internal docker network (`API_INTERNAL_URL`); otherwise the
 * public API URL from the existing env vars is used.
 */
export function getServerApiBaseUrl() {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.API_INTERNAL_URL) {
      return process.env.API_INTERNAL_URL;
    }
  }

  const publicUrl = getApiBaseUrl();
  if (/^https?:\/\//i.test(publicUrl)) {
    return publicUrl;
  }

  return 'https://api.procraft.uz/api';
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
