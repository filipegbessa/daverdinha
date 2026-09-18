import { getSiteMode } from './site-mode';

describe('getSiteMode', () => {
  const original = process.env.SITE_MODE;

  afterEach(() => {
    if (original === undefined) delete process.env.SITE_MODE;
    else process.env.SITE_MODE = original;
  });

  it("returns 'full' only for the exact string 'full'", () => {
    process.env.SITE_MODE = 'full';
    expect(getSiteMode()).toBe('full');
  });

  it("defaults to 'soon' when the variable is not set at all", () => {
    delete process.env.SITE_MODE;
    expect(getSiteMode()).toBe('soon');
  });

  it("falls back to 'soon' for an empty value", () => {
    process.env.SITE_MODE = '';
    expect(getSiteMode()).toBe('soon');
  });

  it("falls back to 'soon' for a typo or a truthy-looking value, never opening the site by accident", () => {
    process.env.SITE_MODE = 'ful';
    expect(getSiteMode()).toBe('soon');
    process.env.SITE_MODE = 'true';
    expect(getSiteMode()).toBe('soon');
    process.env.SITE_MODE = '1';
    expect(getSiteMode()).toBe('soon');
    process.env.SITE_MODE = 'FULL';
    expect(getSiteMode()).toBe('soon');
  });

  it('reads the variable on every call, not once at import time', () => {
    process.env.SITE_MODE = 'full';
    expect(getSiteMode()).toBe('full');
    process.env.SITE_MODE = 'soon';
    expect(getSiteMode()).toBe('soon');
  });
});
