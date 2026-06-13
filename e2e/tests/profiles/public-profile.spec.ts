import { expect, test } from '@playwright/test';

import { createState, mockApi } from '../../helpers/api-mock';
import { publicProfile } from '../../fixtures/data.mjs';

const isNext = process.env.E2E_TARGET !== 'legacy';

test.describe('Public portfolio', () => {
  test('renders the portfolio for an existing username', async ({ page }) => {
    const state = createState();
    await mockApi(page, state); // serves client-side fetches (legacy SPA path)

    await page.goto(`/?username=${publicProfile.username}`);
    await expect(page.getByText(publicProfile.fullName).first()).toBeVisible();
    await expect(page.getByText('Playwright').first()).toBeVisible();
  });

  test('fires the view-track event exactly once', async ({ page }) => {
    const state = createState();
    const trackCalls: string[] = [];
    await mockApi(page, state);
    page.on('request', (request) => {
      if (request.url().includes('/analytics/track') && request.method() === 'POST') {
        trackCalls.push(request.url());
      }
    });

    await page.goto(`/?username=${publicProfile.username}`);
    await expect(page.getByText(publicProfile.fullName).first()).toBeVisible();
    await page.waitForTimeout(1500);
    expect(trackCalls.length).toBe(1);
  });

  test('unknown username shows "Profile not found."', async ({ page }) => {
    const state = createState();
    await mockApi(page, state);

    const response = await page.goto('/?username=totally-missing-user');
    await expect(page.getByText('Profile not found.')).toBeVisible();
    if (isNext) {
      // SSR upgrade: crawlers now get a real 404 (legacy SPA returned 200).
      expect(response?.status()).toBe(404);
    }
  });
});

test.describe('SEO (SSR only)', () => {
  test.skip(!isNext, 'legacy SPA renders client-side without SSR metadata');

  test('profile HTML is fully server-rendered with dynamic metadata', async ({ request }) => {
    // No JavaScript here on purpose: this is what crawlers see.
    const response = await request.get(`/?username=${publicProfile.username}`);
    expect(response.status()).toBe(200);
    const html = await response.text();

    expect(html).toContain(publicProfile.fullName);
    expect(html).toContain(`<title>${publicProfile.fullName} — ${publicProfile.title} | Procraft</title>`);
    expect(html).toContain('property="og:title"');
    expect(html).toContain(`https://${publicProfile.username}.procraft.uz`);
    expect(html).toContain('name="twitter:card"');
    expect(html).toMatch(/name="robots" content="index, follow"/);
    expect(html).toContain('rel="canonical"');
  });

  test('path-based /[username] route stays compatible', async ({ request }) => {
    const response = await request.get(`/${publicProfile.username}`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(publicProfile.fullName);
  });
});
