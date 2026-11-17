import { captureCouponFromUrl, readSavedCoupon, saveCoupon } from './coupon-storage';

describe('coupon-storage', () => {
  beforeEach(() => localStorage.clear());

  it('keeps the coupon from a link, in capitals, until the checkout', () => {
    captureCouponFromUrl('?utm_source=ig&cupom=bemvinda10');
    expect(readSavedCoupon()).toBe('BEMVINDA10');
  });

  it('ignores pages without a coupon and keeps the one saved before', () => {
    captureCouponFromUrl('?cupom=BEMVINDA10');
    captureCouponFromUrl('?page=2');
    expect(readSavedCoupon()).toBe('BEMVINDA10');
  });

  it('clears', () => {
    saveCoupon('BEMVINDA10');
    saveCoupon('');
    expect(readSavedCoupon()).toBe('');
  });
});
