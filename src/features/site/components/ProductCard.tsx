import Link from 'next/link';
import { formatPrice } from '@/features/site/lib/format';
import { productHref } from '@/features/site/lib/paths';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';
import type { Product } from '@/features/site/types/catalog';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={productHref(product)}
      className="group block overflow-hidden rounded-2xl border border-sand-line bg-paper text-left shadow-card transition-shadow hover:shadow-soft"
    >
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
      </div>
    </Link>
  );
}
