'use client';
import { useEffect, useState } from 'react';
import { useCart } from '@/features/store/components/CartProvider';
import type { Product } from '@/features/site/types/catalog';

const CONFIRMATION_MS = 4000;

/**
 * O "adicionar ao carrinho" dos dois botões (o grande da página do produto e
 * o do card): põe 1 unidade, avisa o GA4 e deixa `added` ligado por uns
 * segundos pra mostrar a confirmação. `full` = o carrinho já tem o máximo de
 * produtos diferentes e nada foi adicionado.
 */
export function useAddToCart(product: Product) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timeout = setTimeout(() => setAdded(false), CONFIRMATION_MS);
    return () => clearTimeout(timeout);
  }, [added]);

  function addToCart() {
    const ok = add(product);
    setFull(!ok);
    setAdded(ok);
    if (!ok) return;
    window.gtag?.('event', 'add_to_cart', {
      currency: 'BRL',
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category.name,
          price: product.price,
          quantity: 1,
        },
      ],
    });
  }

  return { addToCart, added, full };
}
