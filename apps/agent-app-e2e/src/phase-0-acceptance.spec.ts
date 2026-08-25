import { expect, test } from '@playwright/test';

test.describe('Phase 0 acceptance — agent application', () => {
  test('boots to an authenticated shell in English, left-to-right', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
    await expect(html).toHaveAttribute('dir', 'ltr');

    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await expect(page.getByText('Test Agent')).toBeVisible();
  });

  test('switches to Arabic and flips direction without a reload', async ({ page }) => {
    await page.goto('/');

    const marker = await page.evaluate(() => {
      (window as unknown as { __marker: number }).__marker = 42;
      return 42;
    });

    await page.getByLabel('Language').selectOption('ar');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Proves it was a runtime switch, not a navigation.
    const survived = await page.evaluate(
      () => (window as unknown as { __marker?: number }).__marker,
    );
    expect(survived).toBe(marker);
  });

  test('renders navigation translated into Arabic', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Language').selectOption('ar');
    await expect(page.getByRole('navigation', { name: 'التنقل الرئيسي' })).toBeVisible();
  });

  test('routes an unheld permission to 403 rather than redirecting silently', async ({ page }) => {
    await page.goto('/admin/sla');
    await expect(page).toHaveURL(/\/403$/);
  });

  test('lets the server preference outrank the device preference after a reload', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByLabel('Language').selectOption('ar');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');

    await page.reload();

    // Spec section 9.3: the device preference is an unauthenticated default and
    // the server preference always wins once authenticated. The fixture identity
    // reports 'en', so Arabic does NOT survive the reload — the choice is
    // remembered on the device, but overridden while this user is signed in.
    // See the completion report: making an explicit switch stick for an
    // authenticated user needs an endpoint that does not exist yet.
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(await page.evaluate(() => localStorage.getItem('crm.device.language'))).toBe('ar');
  });

  test('blocks an operational route on a phone but not a dashboard route', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/tickets');
    await expect(page.getByTestId('small-screen-notice')).toBeVisible();

    await page.goto('/dashboard');
    await expect(page.getByTestId('small-screen-notice')).toHaveCount(0);
  });
});
