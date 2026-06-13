import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(appDir, '../..');

/**
 * The legacy Vite apps read the repo-root .env (envDir: "../.."). Replicate
 * that here so the existing single .env keeps feeding local dev and builds
 * without renaming any variables. Existing process env always wins.
 */
function loadRootEnv() {
  const envPath = path.join(repoRoot, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_.]*)\s*=\s*(.*)\s*$/);
    if (!match) {
      continue;
    }

    const [, key, raw] = match;
    if (process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = raw.replace(/^(['"])(.*)\1$/, '$2');
  }
}

loadRootEnv();

// Standalone tracing needs symlink rights that Windows dev boxes usually
// lack; the Dockerfiles set NEXT_OUTPUT_STANDALONE=true for production.
const useStandalone = process.env.NEXT_OUTPUT_STANDALONE === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(useStandalone ? { output: 'standalone' } : {}),
  reactStrictMode: true,
  transpilePackages: [
    '@procraft/api',
    '@procraft/config',
    '@procraft/hooks',
    '@procraft/i18n',
    '@procraft/services',
    '@procraft/store',
    '@procraft/ui',
    '@procraft/utils',
  ],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || '',
    NEXT_PUBLIC_UPLOADS_URL: process.env.NEXT_PUBLIC_UPLOADS_URL || process.env.VITE_UPLOADS_URL || '',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || process.env.VITE_APP_NAME || '',
  },
  async rewrites() {
    // Parity with the Vite dev proxy: when the API base URL is relative
    // (local dev), forward /api and /uploads to production API.
    return [
      { source: '/api/:path*', destination: 'https://api.procraft.uz/api/:path*' },
      { source: '/uploads/:path*', destination: 'https://api.procraft.uz/uploads/:path*' },
    ];
  },
  experimental: {
    outputFileTracingRoot: repoRoot,
  },
};

export default nextConfig;
