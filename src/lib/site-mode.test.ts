import { getSiteMode } from './site-mode';
import { mockSiteSettings } from '@/lib/__mocks__/site-settings';

describe('getSiteMode', () => {
  it("is 'full' with the site switched on in the dashboard", async () => {
    mockSiteSettings({ siteEnabled: true });
    await expect(getSiteMode()).resolves.toBe('full');
  });

  it("is 'soon' with the site switched off", async () => {
    mockSiteSettings({ siteEnabled: false });
    await expect(getSiteMode()).resolves.toBe('soon');
  });
});
