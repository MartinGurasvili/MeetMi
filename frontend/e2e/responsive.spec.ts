import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll, login } from './helpers';

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

for (const viewport of viewports) {
  test(`login and dashboard are responsive on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await login(page);
    await expect(page.getByLabel('Interactive office floor plan')).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
}
