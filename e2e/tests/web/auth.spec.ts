import { expect, test } from '@playwright/test';

import { createState, mockApi, seedSessionHint } from '../../helpers/api-mock';

test.describe('Auth flows', () => {
  test('login redirects to dashboard and loads the session', async ({ page }) => {
    const state = createState();
    await mockApi(page, state);

    await page.goto('/login');
    await expect(page.getByText('Xush kelibsiz')).toBeVisible();

    await page.getByLabel('Elektron pochta yoki foydalanuvchi nomi').fill('e2etester');
    await page.getByLabel('Parol').fill('correct-password');
    await page.getByRole('button', { name: 'Kirish' }).click();

    await page.waitForURL('**/');
    await expect(page.getByText('Procraft ish maydoningiz')).toBeVisible();
    expect(state.calls).toContain('POST /auth/login');
    // CSRF cookie is always fetched before the login mutation.
    expect(state.calls.indexOf('GET /auth/csrf')).toBeLessThan(state.calls.indexOf('POST /auth/login'));
  });

  test('login with wrong password shows the error and stays on /login', async ({ page }) => {
    const state = createState();
    await mockApi(page, state);

    await page.goto('/login');
    await page.getByLabel('Elektron pochta yoki foydalanuvchi nomi').fill('e2etester');
    await page.getByLabel('Parol').fill('wrong-password');
    await page.getByRole('button', { name: 'Kirish' }).click();

    // The error paragraph is rendered with antd's danger typography style.
    await expect(page.locator('.ant-typography-danger')).toBeVisible();
    expect(page.url()).toContain('/login');
  });

  test('login respects returnTo query parameter', async ({ page }) => {
    const state = createState();
    await mockApi(page, state);

    await page.goto('/login?returnTo=%2Fanalytics');
    await page.getByLabel('Elektron pochta yoki foydalanuvchi nomi').fill('e2etester');
    await page.getByLabel('Parol').fill('correct-password');
    await page.getByRole('button', { name: 'Kirish' }).click();

    await page.waitForURL('**/analytics');
    await expect(page.getByText('Analitika', { exact: true })).toBeVisible();
  });

  test('register asks for the verification code, then signs in', async ({ page }) => {
    const state = createState();
    await mockApi(page, state);

    await page.goto('/register');
    await page.getByLabel('Elektron pochta').fill('e2e@procraft.uz');
    await page.getByLabel("To'liq ism").fill('E2E Tester');
    await page.getByLabel('Foydalanuvchi nomi').fill('e2etester');
    await page.getByLabel('Parol').fill('strong-password-123');
    await page.getByRole('button', { name: 'Kod yuborish' }).click();

    await expect(page.getByLabel('Tasdiqlash kodi')).toBeVisible();
    expect(state.calls).toContain('POST /auth/register');

    await page.getByLabel('Tasdiqlash kodi').fill('1234');
    await page.getByRole('button', { name: 'Tasdiqlash' }).click();

    await page.waitForURL('**/');
    expect(state.calls).toContain('POST /auth/register/verify');
  });

  test('logout clears the session and lands on /login', async ({ page }) => {
    const state = createState({ authenticated: true });
    await mockApi(page, state);
    await seedSessionHint(page);

    await page.goto('/');
    await expect(page.getByText('Procraft ish maydoningiz')).toBeVisible();

    await page.getByText('Chiqish', { exact: true }).click();
    await page.waitForURL('**/login');
    expect(state.calls).toContain('POST /auth/logout');
    expect(state.authenticated).toBe(false);
  });

  test('a 401 triggers silent refresh and the original request is retried', async ({ page }) => {
    const state = createState({ authenticated: true, failNextMeWith401: true });
    await mockApi(page, state);
    await seedSessionHint(page);

    await page.goto('/');
    // Despite the first /profile/me 401, the interceptor refreshes and
    // retries — the dashboard still renders the loaded profile state.
    await expect(page.getByText('Profil yaratilgan')).toBeVisible();
    expect(state.calls).toContain('POST /auth/refresh');
    expect(state.calls.filter((c) => c === 'GET /profile/me').length).toBeGreaterThanOrEqual(2);
  });

  test('reset-password requests a code and updates the password', async ({ page }) => {
    const state = createState();
    await mockApi(page, state);
    await page.route('**/api/auth/password/forgot', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ resetId: 'e2e-reset-id', maskedEmail: 'e2***@procraft.uz' }),
      }),
    );
    await page.route('**/api/auth/password/reset', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );

    await page.goto('/reset-password');
    await page.getByLabel('Elektron pochta').fill('e2e@procraft.uz');
    await page.getByRole('button', { name: 'Kod yuborish' }).click();

    await page.getByLabel('Tasdiqlash kodi').fill('1234');
    await page.getByLabel('Yangi parol').fill('new-strong-password');
    await page.getByRole('button', { name: 'Parolni yangilash' }).click();

    await expect(page.getByText('Parol yangilandi', { exact: false })).toBeVisible();
  });
});
