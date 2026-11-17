import { formatCurrency } from '@/lib/format';
import type { CouponAdmin } from '@/features/admin/types/admin';

const brl = (value: number) => formatCurrency(value, 'BRL');

const day = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' }).format(
    new Date(iso),
  );

/** "15% de desconto, até R$ 50,00" / "R$ 20,00 de desconto" / "Frete grátis". */
export function couponBenefit(coupon: Pick<CouponAdmin, 'type' | 'value' | 'maxDiscount'>): string {
  if (coupon.type === 'free_shipping') return 'Frete grátis';
  if (coupon.type === 'fixed') return `${brl(coupon.value ?? 0)} de desconto`;
  return `${coupon.value ?? 0}% de desconto${coupon.maxDiscount ? `, até ${brl(coupon.maxDiscount)}` : ''}`;
}

/** Onde vale, com os nomes já resolvidos pela tela. */
export function couponScope(coupon: Pick<CouponAdmin, 'scope'>, names: string[] = []): string {
  const list = names.length > 0 ? names.join(', ') : '';
  switch (coupon.scope) {
    case 'order':
      return 'em todo o pedido de produtos';
    case 'categories':
      return list ? `nos produtos da categoria ${list}` : 'nas categorias escolhidas';
    case 'products':
      return list ? `em ${list}` : 'nos produtos escolhidos';
    case 'events':
      return list ? `nos ingressos de ${list}` : 'nos ingressos de todos os eventos';
  }
}

/**
 * A frase da prévia: "15% de desconto, até R$ 50,00, em todo o pedido de
 * produtos, acima de R$ 100,00, até 30/11, máximo 50 usos".
 */
export function couponSummary(
  coupon: Pick<
    CouponAdmin,
    'type' | 'value' | 'maxDiscount' | 'scope' | 'minSubtotal' | 'startsAt' | 'endsAt' | 'maxUses'
  >,
  names: string[] = [],
): string {
  return [
    couponBenefit(coupon),
    couponScope(coupon, names),
    coupon.minSubtotal ? `acima de ${brl(coupon.minSubtotal)}` : null,
    coupon.startsAt ? `a partir de ${day(coupon.startsAt)}` : null,
    coupon.endsAt ? `até ${day(coupon.endsAt)}` : null,
    coupon.maxUses ? `máximo ${coupon.maxUses} ${coupon.maxUses === 1 ? 'uso' : 'usos'}` : null,
  ]
    .filter(Boolean)
    .join(', ');
}

export type CouponStatus = 'active' | 'scheduled' | 'expired' | 'sold_out' | 'inactive';

export const COUPON_STATUS_LABELS: Record<CouponStatus, string> = {
  active: 'Ativo',
  scheduled: 'Agendado',
  expired: 'Expirado',
  sold_out: 'Esgotado',
  inactive: 'Desativado',
};

/** A situação do cupom agora, pra lista. */
export function couponStatus(
  coupon: Pick<CouponAdmin, 'active' | 'startsAt' | 'endsAt' | 'maxUses' | 'uses' | 'reserved'>,
  now: Date = new Date(),
): CouponStatus {
  if (!coupon.active) return 'inactive';
  if (coupon.endsAt && new Date(coupon.endsAt) <= now) return 'expired';
  if (coupon.maxUses !== null && coupon.uses + coupon.reserved >= coupon.maxUses) return 'sold_out';
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return 'scheduled';
  return 'active';
}
