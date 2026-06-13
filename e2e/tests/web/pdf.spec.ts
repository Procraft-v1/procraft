import { expect, test } from '@playwright/test';

import { createState, mockApi, seedSessionHint } from '../../helpers/api-mock';

test.describe('Resume PDF', () => {
  test('download button fetches /pdf/download and saves a file', async ({ page }) => {
    const state = createState({ authenticated: true });
    await mockApi(page, state);
    await seedSessionHint(page);

    await page.goto('/pdf');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF yuklab olish' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('procraft-resume.pdf');
    expect(state.calls).toContain('GET /pdf/download');
    await expect(page.getByText('PDF yuklab olish boshlandi')).toBeVisible();
  });

  test('preview opens the PDF modal', async ({ page }) => {
    const state = createState({ authenticated: true });
    await mockApi(page, state);
    await seedSessionHint(page);

    await page.goto('/pdf');
    await page.getByRole('button', { name: "PDF ko'rish" }).click();

    await expect(page.locator('.ant-modal:visible iframe[title="Resume PDF preview"]')).toBeVisible();
  });
});
