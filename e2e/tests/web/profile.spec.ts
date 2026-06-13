import { expect, test } from '@playwright/test';

import { createState, mockApi, seedSessionHint } from '../../helpers/api-mock';

test.describe('Profile editing', () => {
  test('profile form is prefilled from the API', async ({ page }) => {
    const state = createState({ authenticated: true });
    await mockApi(page, state);
    await seedSessionHint(page);

    await page.goto('/profile');
    await expect(page.getByLabel("To'liq ism")).toHaveValue('E2E Tester');
    await expect(page.getByLabel('Lavozim')).toHaveValue('QA Engineer');
    await expect(page.getByLabel('Manzil')).toHaveValue('Tashkent, Uzbekistan');
  });

  test('saving the profile PUTs the edited values', async ({ page }) => {
    const state = createState({ authenticated: true });
    await mockApi(page, state);
    await seedSessionHint(page);

    await page.goto('/profile');
    await page.getByLabel('Lavozim').fill('Senior QA Engineer');
    await page.getByRole('button', { name: 'Profilni saqlash' }).click();

    await expect(page.getByText('Profil saqlandi')).toBeVisible();
    expect(state.calls).toContain('PUT /profile');
    expect((state.profile as { title?: string })?.title).toBe('Senior QA Engineer');
  });

  test('section lists render the seeded items', async ({ page }) => {
    const state = createState({ authenticated: true });
    await mockApi(page, state);
    await seedSessionHint(page);

    await page.goto('/profile');
    await expect(page.getByText('Playwright', { exact: true })).toBeVisible();
    await expect(page.getByText('Procraft E2E suite')).toBeVisible();
    await expect(page.getByText('QA Engineer - Procraft')).toBeVisible();
  });

  test('adding a skill posts to /profile/skills', async ({ page }) => {
    const state = createState({ authenticated: true });
    await mockApi(page, state);
    await seedSessionHint(page);

    await page.goto('/profile');
    const skillsCard = page.locator('.ant-card', { hasText: "Ko'nikmalar" }).first();
    await skillsCard.getByRole('button', { name: "Qo'shish" }).click();

    const modal = page.locator('.ant-modal:visible');
    await modal.getByLabel("Ko'nikma nomi").fill('Cypress');
    await modal.getByRole('button', { name: 'Saqlash' }).click();

    await expect(page.getByText("Ko'nikmalar saqlandi")).toBeVisible();
    expect(state.calls).toContain('POST /profile/skills');
  });
});
