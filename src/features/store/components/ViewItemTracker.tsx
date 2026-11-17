'use client';
import { useEffect } from 'react';
import type { Product } from '@/features/site/types/catalog';

/**
 * Conta a visita à página do produto no GA4 (`view_item`), o primeiro passo
 * do funil de compra (visto → carrinho → checkout → compra). Sem tela.
 */
export function ViewItemTracker({ product }: { product: Product }) {
  useEffect(() => {
    window.gtag?.('event', 'view_item', {
      currency: 'BRL',
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category.name,
          price: product.price,
        },
      ],
    });
  }, [product.id, product.name, product.price, product.category.name]);
  return null;
}
