'use client';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { SiteButton } from '@/features/site/components/SiteButton';
import { useCart } from '@/features/store/components/CartProvider';
import { useStorePause } from '@/features/store/components/StoreEnabled';
import type { Product } from '@/features/site/types/catalog';

export interface BuyAgainItem {
  /** O produto como está hoje no catálogo (preço atual, ativo e com estoque). */
  product: Product;
  quantity: number;
}

/**
 * Põe no carrinho os itens de um pedido antigo e leva pro carrinho, onde a
 * cotação mostra preço e estoque de hoje. Só recebe o que ainda está à venda;
 * `missing` conta os que saíram do catálogo ou esgotaram. Some com a loja em
 * pausa.
 */
export function BuyAgainButton({
  items,
  missing,
  label = 'Comprar de novo',
}: {
  items: BuyAgainItem[];
  missing: number;
  label?: string;
}) {
  const router = useRouter();
  const { add } = useCart();
  const pause = useStorePause();
  if (items.length === 0 || pause) return null;

  function buyAgain() {
    for (const { product, quantity } of items) add(product, quantity);
    router.push('/carrinho');
  }

  return (
    <div className="space-y-2">
      <SiteButton type="button" variant="secondary" onClick={buyAgain}>
        <ShoppingBag className="size-4" aria-hidden="true" />
        {label}
      </SiteButton>
      {missing > 0 && (
        <p className="text-sm text-ink-soft">
          {missing === 1
            ? '1 item deste pedido não está mais disponível e fica de fora.'
            : `${missing} itens deste pedido não estão mais disponíveis e ficam de fora.`}
        </p>
      )}
    </div>
  );
}
