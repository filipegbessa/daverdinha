import { shouldEnableAnalytics } from './analytics';

describe('shouldEnableAnalytics', () => {
  it('is false when NEXT_PUBLIC_GA_MEASUREMENT_ID is unset', () => {
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    expect(shouldEnableAnalytics()).toBe(false);
  });

  it('is true when NEXT_PUBLIC_GA_MEASUREMENT_ID is set', () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';
    expect(shouldEnableAnalytics()).toBe(true);
  });
});
