import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { productHref } from '@/features/site/lib/paths';
import { AvailabilityBadge } from '@/features/site/components/AvailabilityBadge';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';
import { QuickAddButton } from '@/features/store/components/QuickAddButton';
import { isStoreEnabled } from '@/features/store/lib/store-enabled';
import type { Product } from '@/features/site/types/catalog';

/**
 * `full`: foto grande, usado no catálogo. `compact`: foto pequena ao lado do
 * texto, sem botão de comprar — mesmo padrão do `EventCard` compacto, usado
 * nas listas cruzadas (produtos em destaque na agenda, mais vendidos na
 * página do produto).
 */
export function ProductCard({ product, variant = 'full' }: { product: Product; variant?: 'full' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <Link
        href={productHref(product)}
        className="grid h-full grid-cols-[4rem_1fr] gap-4 overflow-hidden rounded-2xl border border-sand-line bg-paper p-4 shadow-card transition-shadow hover:shadow-soft"
      >
        <ImagePlaceholder
          src={product.images[0]}
          alt={product.name}
          sizes="64px"
          className="aspect-square self-start rounded-xl"
        />
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs tracking-wider text-ink-soft uppercase">{product.category.name}</p>
          <h3 className="font-medium text-berry">{product.name}</h3>
          <p className="text-sm text-ink tabular-nums">{formatPrice(product.price)}</p>
          <div className="pt-1">
            <AvailabilityBadge product={product} />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-sand-line bg-paper text-left shadow-card transition-shadow hover:shadow-soft">
      <Link href={productHref(product)} className="block flex-1">
        <ImagePlaceholder
          src={product.images[0]}
          alt={product.name}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="aspect-square transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div className="space-y-0.5 p-4">
          <p className="text-xs tracking-wider text-ink-soft uppercase">{product.category.name}</p>
          <h3 className="font-medium text-berry">{product.name}</h3>
          <p className="text-sm text-ink tabular-nums">{formatPrice(product.price)}</p>
          <div className="pt-1.5">
            <AvailabilityBadge product={product} />
          </div>
        </div>
      </Link>
      {isStoreEnabled() && (
        <div className="px-4 pb-4">
          <QuickAddButton product={product} />
        </div>
      )}
    </div>
  );
}
