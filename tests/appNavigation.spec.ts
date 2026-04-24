import { test, expect } from './fixtures';
import { PLUGIN_BASE_URL } from '../src/constants';

test.describe('navigating app', () => {
  test('App should render successfully', async ({ gotoPage, page }) => {
    await gotoPage(`/${PLUGIN_BASE_URL}`);
    await expect(page.getByText('Loki Operational UI')).toBeVisible();
  });
});
