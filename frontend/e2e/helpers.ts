import { expect, type Page } from '@playwright/test';

export async function login(page: Page, email = 'user@meetmi.example.com', password = 'UserPass123') {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('heading', { name: /find a space nearby/i })).toBeVisible();
}

export async function expectNoHorizontalScroll(page: Page) {
  const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(hasHorizontalScroll).toBe(false);
}
