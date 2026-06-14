import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { login } from './helpers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SMALL_ICS = path.join(__dirname, '../public/sample-meetings/aurora-standup-small.ics');

async function switchToMeetingRooms(page: import('@playwright/test').Page) {
  const toggle = page.locator('.dashboard-filter-panel .dashboard-panel-toggle');
  await toggle.click();
  await page.getByRole('button', { name: 'Meeting room', exact: true }).click();
  await toggle.click();
}

test.describe('Meeting room slots and ICS recommender', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('books a meeting room via the vertical timeline', async ({ page }) => {
    await switchToMeetingRooms(page);

    const recommendation = page.locator('.dashboard-recommendation').first();
    await expect(recommendation).toBeVisible({ timeout: 15_000 });
    await recommendation.click();

    await expect(page.getByText('Availability', { exact: true })).toBeVisible();
    await expect(page.locator('.room-timeline-slot.is-free').first()).toBeVisible();

    const freeSlots = page.locator('.room-timeline-slot.is-free');
    const count = await freeSlots.count();
    expect(count).toBeGreaterThan(1);

    await freeSlots.nth(0).click();
    await freeSlots.nth(1).click();

    const bookButton = page.locator('.room-timeline-book');
    await expect(bookButton).toBeVisible();
    await bookButton.click();

    await expect(page.locator('.app-toast.is-success')).toBeVisible({ timeout: 12_000 });
    await expect(page.locator('.room-timeline-slot.is-mine').first()).toBeVisible({ timeout: 12_000 });
  });

  test('uploads an ICS file and quick-books a recommended room', async ({ page }) => {
    await expect(page.locator('.dashboard-recommendations .ics-file-input')).toHaveCount(1);
    await expect(page.locator('.ics-recommender')).toHaveCount(0);

    await page.locator('.ics-file-input').setInputFiles(SMALL_ICS);
    await expect(page.locator('.ics-recommender-summary')).toContainText(/Aurora Core AI team/i);

    await switchToMeetingRooms(page);

    const recommendation = page.locator('.dashboard-recommendation').first();
    await expect(recommendation).toBeVisible({ timeout: 15_000 });

    await recommendation.click();
    await expect(page.locator('.space-details-root')).toBeVisible();

    const quickBook = page.getByRole('button', { name: /quick book/i });
    if (await quickBook.isVisible()) {
      await quickBook.click();
      await expect(page.locator('.app-toast.is-success, .space-details-availability.is-mine').first()).toBeVisible({
        timeout: 12_000,
      });
    } else {
      const freeSlots = page.locator('.room-timeline-slot.is-free');
      await freeSlots.nth(0).click();
      await freeSlots.nth(1).click();
      await page.locator('.room-timeline-book').click();
      await expect(page.locator('.app-toast.is-success')).toBeVisible({ timeout: 12_000 });
    }
  });
});
