import type { Page } from '@playwright/test';

/**
 * Grafana may show a "What's new" overlay in the root portal container.
 * If a Close control is visible there, click it; otherwise no-op.
 */
export async function dismissWhatsNewPortalIfPresent(page: Page): Promise<void> {
  const portal = page.getByTestId('data-testid portal-container');
  const closeButton = portal.getByRole('button', { name: 'Close' });

  try {
    await closeButton.waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    return;
  }

  await closeButton.click();
  await closeButton.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => undefined);
}
