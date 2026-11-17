import { couponStatus, couponSummary } from './coupon-text';
import type { CouponAdmin } from '@/features/admin/types/admin';

const base: CouponAdmin = {
  id: 'c1',
  code: 'BEMVINDA',
  description: null,
  type: 'percent',
  value: 15,
  maxDiscount: 50,
  scope: 'categories',
  minSubtotal: 100,
  startsAt: null,
  endsAt: '2026-11-30T03:00:00.000Z',
  maxUses: 50,
  active: true,
  categoryIds: ['cat1'],
  productIds: [],
  eventIds: [],
  uses: 3,
  reserved: 1,
  createdAt: '2026-11-17T12:00:00.000Z',
};

describe('coupon-text', () => {
  it('describes the coupon in one sentence', () => {
    expect(couponSummary(base, ['Vasos'])).toBe(
      '15% de desconto, até R$ 50,00, nos produtos da categoria Vasos, acima de R$ 100,00, até 30/11, máximo 50 usos',
    );
    expect(
      couponSummary({
        ...base,
        type: 'free_shipping',
        value: null,
        maxDiscount: null,
        scope: 'order',
        minSubtotal: null,
        endsAt: null,
        maxUses: null,
      }),
    ).toBe('Frete grátis, em todo o pedido de produtos');
  });

  it('tells the status now', () => {
    const now = new Date('2026-11-20T12:00:00Z');
    expect(couponStatus(base, now)).toBe('active');
    expect(couponStatus({ ...base, active: false }, now)).toBe('inactive');
    expect(couponStatus({ ...base, endsAt: '2026-11-19T03:00:00.000Z' }, now)).toBe('expired');
    expect(couponStatus({ ...base, maxUses: 4 }, now)).toBe('sold_out');
    expect(couponStatus({ ...base, startsAt: '2026-11-25T03:00:00.000Z' }, now)).toBe('scheduled');
  });
});
