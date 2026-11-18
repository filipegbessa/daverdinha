import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/features/site/types/catalog';

/** "-17%": o desconto da promoção, arredondado. */
export function discountPercent(price: number, listPrice: number): number {
  return Math.round((1 - price / listPrice) * 100);
}

/**
 * O preço do produto. Com promoção valendo (`listPrice`), mostra o "de"
 * riscado, o "por" em destaque e o selo de desconto; o leitor de tela ouve
 * "De R$ 119,00 por R$ 99,00". Sem promoção, só o preço.
 */
export function ProductPrice({
  product,
  size = 'sm',
  showBadge = true,
  className,
}: {
  product: Pick<Product, 'price' | 'listPrice'>;
  size?: 'sm' | 'lg';
  /** No card do catálogo o selo vai pra cima da foto (`DiscountBadge`), então sai daqui. */
  showBadge?: boolean;
  className?: string;
}) {
  const { price, listPrice } = product;
  const onSale = typeof listPrice === 'number' && listPrice > price;
  const main = size === 'lg' ? 'text-2xl font-semibold text-moss' : 'text-sm text-ink';
  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-1 tabular-nums', className)}>
      {onSale && (
        <s className={size === 'lg' ? 'text-base text-ink-soft' : 'text-xs text-ink-soft'}>
          <span className="sr-only">De </span>
          {formatPrice(listPrice)}
        </s>
      )}
      <span className={cn(main, onSale && 'font-semibold')}>
        {onSale && <span className="sr-only">por </span>}
        {formatPrice(price)}
      </span>
      {onSale && showBadge && (
        <span className="rounded-full bg-berry px-2 py-0.5 text-xs font-semibold text-paper">
          -{discountPercent(price, listPrice)}%
        </span>
      )}
    </p>
  );
}

/**
 * O selo "-17%" em cima da foto do card, como nos temas padrão da Shopify e
 * da Nuvemshop. Só aparece com promoção valendo. Quem usa põe a foto num
 * contêiner `relative`.
 */
export function DiscountBadge({
  product,
  size = 'md',
}: {
  product: Pick<Product, 'price' | 'listPrice'>;
  size?: 'sm' | 'md';
}) {
  const { price, listPrice } = product;
  if (typeof listPrice !== 'number' || listPrice <= price) return null;
  return (
    <span
      className={cn(
        'absolute z-10 rounded-full bg-berry font-semibold text-paper shadow-card tabular-nums',
        size === 'md' ? 'top-3 left-3 px-2.5 py-1 text-xs' : 'top-1 left-1 px-1.5 py-0.5 text-[0.65rem]',
      )}
    >
      -{discountPercent(price, listPrice)}%<span className="sr-only"> de desconto</span>
    </span>
  );
}
