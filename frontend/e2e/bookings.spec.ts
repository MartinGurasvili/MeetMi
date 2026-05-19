import { expect, test } from '@playwright/test';
import { login } from './helpers';

test('seeded regular user has bookings', async ({ page }) => {
  await login(page, 'user@meetmi.example.com', 'UserPass123');
  await page.goto('/bookings');
  await expect(page.getByRole('heading', { name: /my bookings/i })).toBeVisible();
  await expect(page.getByText(/active reservations/i)).toBeVisible();
  await expect(page.locator('article').first()).toBeVisible();
});
