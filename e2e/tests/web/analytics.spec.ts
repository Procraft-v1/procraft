import { expect, test } from '@playwright/test';

import { createState, mockApi, seedSessionHint } from '../../helpers/api-mock';

test.describe('Analytics', () => {
  test('renders summary stats from the API', async ({ page }) => {
    const state = createState({ authenticated: true });
    await mockApi(page, state);
    await seedSessionHint(page);

    await page.goto('/analytics');
    await expect(page.getByText("Jami ko'rishlar")).toBeVisible();
    await expect(page.getByText('42', { exact: true })).toBeVisible();
    await expect(page.getByText('Uzbekistan', { exact: true })).toBeVisible();
    // 'Unknown' is normalized to the Uzbek label.
    await expect(page.getByText("Noma'lum", { exact: true })).toBeVisible();
    // Relative time strings are localized.
    await expect(page.getByText('5 daqiqa oldin')).toBeVisible();
    expect(state.calls).toContain('GET /analytics/summary');
  });
});
