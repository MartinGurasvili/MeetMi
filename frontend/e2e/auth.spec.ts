import { expect, test } from '@playwright/test';
import { login, openAdminFromDashboard } from './helpers';

test('regular user can log in', async ({ page }) => {
  await login(page, 'user@meetmi.example.com', 'UserPass123');
  await expect(page.getByText(/hot desks/i)).toBeVisible();
});

test('admin user can log in and open admin area', async ({ page }) => {
  await login(page, 'admin@meetmi.example.com', 'AdminPass123');
  await openAdminFromDashboard(page);
  await expect(page.getByRole('tab', { name: /bookings/i })).toBeVisible();
});
