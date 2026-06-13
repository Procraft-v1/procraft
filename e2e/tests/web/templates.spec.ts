import { expect, test } from '@playwright/test';

import { createState, mockApi, seedSessionHint } from '../../helpers/api-mock';

test.describe('Templates', () => {
  test('lists all five templates and marks the selected one', async ({ page }) => {
    const state = createState({ authenticated: true });
    await mockApi(page, state);
    await seedSessionHint(page);

    await page.goto('/templates');
    for (const name of ['Minimal', 'Modern', 'Classic', 'Editorial', 'Developer']) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
    await expect(page.getByText('Tanlangan', { exact: true }).first()).toBeVisible();
  });

  test('selecting another template posts the selection and refreshes state', async ({ page }) => {
    const state = createState({ authenticated: true });
    await mockApi(page, state);
    await seedSessionHint(page);

    await page.goto('/templates');
    const modernCard = page.locator('.template-card--modern');
    await modernCard.getByRole('button', { name: 'Shablonni tanlash' }).click();

    await expect(page.getByText('Shablon tanlandi')).toBeVisible();
    expect(state.calls).toContain('POST /profile/template/tpl-modern');
    expect((state.profile as { templateSlug?: string })?.templateSlug).toBe('modern');
  });
});
