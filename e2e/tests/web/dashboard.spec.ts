import { expect, test } from '@playwright/test';

import { createState, mockApi, seedSessionHint } from '../../helpers/api-mock';

test.describe('Dashboard shell + URL compatibility', () => {
  test('all legacy URLs respond and render their screens', async ({ page }) => {
    const state = createState({ authenticated: true });
    await mockApi(page, state);
    await seedSessionHint(page);

    const screens: Array<[string, string | RegExp]> = [
      ['/', 'Procraft ish maydoningiz'],
      ['/profile', "Profil ma'lumotlari"],
      ['/templates', "Ommaviy profilingiz qanday ko'rinishda chiqishini tanlang."],
      ['/analytics', "Portfolio profilingiz ko'rishlari va tashriflar bo'yicha qisqa hisobot."],
      ['/pdf', 'PDF eksport'],
      ['/settings', 'Sozlamalar'],
    ];

    for (const [path, marker] of screens) {
      await page.goto(path);
      await expect(page.getByText(marker).first()).toBeVisible();
    }
  });

  test('/subscription redirects to the dashboard home', async ({ page }) => {
    const state = createState({ authenticated: true });
    await mockApi(page, state);
    await seedSessionHint(page);

    await page.goto('/subscription');
    await page.waitForURL((url) => url.pathname === '/');
    await expect(page.getByText('Procraft ish maydoningiz')).toBeVisible();
  });

  test('sidebar navigation drives the URL', async ({ page }) => {
    const state = createState({ authenticated: true });
    await mockApi(page, state);
    await seedSessionHint(page);

    await page.goto('/');
    await page.getByRole('menuitem', { name: 'Shablonlar' }).click();
    await page.waitForURL('**/templates');
    await page.getByRole('menuitem', { name: 'Analitika' }).click();
    await page.waitForURL('**/analytics');
    await page.getByRole('menuitem', { name: 'Sozlamalar' }).click();
    await page.waitForURL('**/settings');
  });

  test('anonymous visitor sees the shell with a login button (no forced redirect)', async ({ page }) => {
    const state = createState({ authenticated: false });
    await mockApi(page, state);

    await page.goto('/');
    // Legacy behavior: dashboard is reachable, auth is prompted contextually.
    await expect(page.getByRole('button', { name: 'Kirish' }).first()).toBeVisible();
    expect(page.url()).not.toContain('/login');
  });

  test('portfolio link appears for a user with a saved profile', async ({ page }) => {
    const state = createState({ authenticated: true });
    await mockApi(page, state);
    await seedSessionHint(page);

    await page.goto('/');
    await expect(page.getByText('https://e2etester.procraft.uz/')).toBeVisible();
  });
});
