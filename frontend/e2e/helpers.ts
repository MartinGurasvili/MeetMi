import { expect, type Page } from '@playwright/test';

export async function login(page: Page, email = 'user@meetmi.example.com', password = 'UserPass123') {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  const loginResponse = page.waitForResponse((response) => response.url().includes('/auth/login') && response.ok());
  await page.getByRole('button', { name: /sign in/i }).click();
  await loginResponse;
  await expect(page.getByRole('heading', { name: /find a space nearby/i })).toBeVisible();
}

export async function openBookingsFromDashboard(page: Page) {
  await page.getByRole('button', { name: /account menu/i }).click();
  await page.getByRole('menuitem', { name: /bookings/i }).click();
  await expect(page.getByRole('heading', { name: /my bookings/i })).toBeVisible();
}

export async function openAdminFromDashboard(page: Page) {
  await page.getByRole('button', { name: /account menu/i }).click();
  await page.getByRole('menuitem', { name: /^admin$/i }).click();
  await expect(page.getByRole('heading', { name: /operations console/i })).toBeVisible();
}

export async function expectNoHorizontalScroll(page: Page) {
  const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(hasHorizontalScroll).toBe(false);
}
