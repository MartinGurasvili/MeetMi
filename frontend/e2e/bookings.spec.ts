import { expect, test } from '@playwright/test';
import { login, openBookingsFromDashboard } from './helpers';

test('seeded regular user has bookings', async ({ page }) => {
  await login(page, 'user@meetmi.example.com', 'UserPass123');
  await openBookingsFromDashboard(page);
  await expect(page.getByText(/upcoming/i).first()).toBeVisible();
  await expect(page.locator('.bookings-card, article').first()).toBeVisible({ timeout: 15_000 });
});
