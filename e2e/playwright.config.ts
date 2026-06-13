import { defineConfig, devices } from '@playwright/test';

/**
 * E2E_TARGET=next  (default) — runs against the Next.js production servers.
 * E2E_TARGET=legacy          — runs the same specs against the legacy Vite
 *                              SPA previews, proving behavioral parity.
 * Both targets require a prior `pnpm run build` at the repo root.
 */
const target = process.env.E2E_TARGET === 'legacy' ? 'legacy' : 'next';

// NOTE: keep `localhost`, not 127.0.0.1 — the profiles app parses the
// username from the Host header subdomain, and an IP host ("127.0.0.1")
// would be read as subdomain "127" (the legacy SPA behaves identically).
const webBaseURL = target === 'legacy' ? 'http://localhost:6274' : 'http://localhost:3001';
const profilesBaseURL = target === 'legacy' ? 'http://localhost:6275' : 'http://localhost:3002';

const webServers = [
  {
    command: 'node mock-api/server.mjs',
    url: 'http://127.0.0.1:4801/api/health',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  target === 'legacy'
    ? {
        command: 'pnpm --filter @procraft/web-legacy preview',
        cwd: '..',
        url: webBaseURL,
        reuseExistingServer: true,
        timeout: 60_000,
      }
    : {
        command: 'pnpm --filter @procraft/web start',
        cwd: '..',
        url: `${webBaseURL}/login`,
        reuseExistingServer: true,
        timeout: 60_000,
      },
  target === 'legacy'
    ? {
        command: 'pnpm --filter @procraft/profiles-legacy preview',
        cwd: '..',
        url: profilesBaseURL,
        reuseExistingServer: true,
        timeout: 60_000,
      }
    : {
        command: 'pnpm --filter @procraft/profiles start',
        cwd: '..',
        url: profilesBaseURL,
        reuseExistingServer: true,
        timeout: 60_000,
        env: {
          // SSR fetches hit the deterministic mock API instead of production.
          API_INTERNAL_URL: 'http://127.0.0.1:4801/api',
        },
      },
];

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 45_000,
  use: {
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  metadata: { target },
  projects: [
    {
      name: 'web',
      testDir: './tests/web',
      use: { baseURL: webBaseURL },
    },
    {
      name: 'profiles',
      testDir: './tests/profiles',
      use: { baseURL: profilesBaseURL },
    },
  ],
  webServer: webServers,
});
