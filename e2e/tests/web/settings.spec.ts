import { expect, test } from '@playwright/test';

import { createState, mockApi, seedSessionHint } from '../../helpers/api-mock';

test.describe('Settings', () => {
  test('shows account info and the portfolio link', async ({ page }) => {
    const state = createState({ authenticated: true });
    await mockApi(page, state);
    await seedSessionHint(page);

    await page.goto('/settings');
    await expect(page.getByLabel('Email')).toHaveValue('e2e@procraft.uz');
    await expect(page.getByLabel('Foydalanuvchi nomi')).toHaveValue('e2etester');
    await expect(page.getByText('https://e2etester.procraft.uz/')).toBeVisible();
    await expect(page.getByText('Email tasdiqlangan')).toBeVisible();
  });

  test('saving account changes PUTs /auth/account', async ({ page }) => {
    const state = createState({ authenticated: true });
    await mockApi(page, state);
    await seedSessionHint(page);

    await page.goto('/settings');
    await page.getByLabel('Telefon raqam').fill('+998 90 765 43 21');
    await page.getByRole('button', { name: 'Saqlash', exact: true }).click();

    await expect(page.getByText("Account ma'lumotlari saqlandi")).toBeVisible();
    expect(state.calls).toContain('PUT /auth/account');
  });
});
