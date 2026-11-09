'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { isSample } from '@/features/site/data/samples';
import { useCart } from '@/features/store/components/CartProvider';
import type { Product } from '@/features/site/types/catalog';

const CONFIRMATION_MS = 4000;

const BUTTON =
  'inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold shadow-card transition-shadow sm:w-auto';

/**
 * O botão principal da página do produto com a loja ligada. Produto de
 * exemplo (prévia) e esgotado não vão pro carrinho: o checkout responderia
 * 409. Depois de adicionar, mostra por uns segundos o atalho pro carrinho.
 */
export function AddToCartButton({ product }: { product: Product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timeout = setTimeout(() => setAdded(false), CONFIRMATION_MS);
    return () => clearTimeout(timeout);
  }, [added]);

  if (isSample(product)) {
    return (
      <button type="button" disabled className={`${BUTTON} cursor-not-allowed bg-sand-line text-ink-soft`}>
        Disponível no lançamento
      </button>
    );
  }
  if (product.availability === 'sold_out') {
    return (
      <button type="button" disabled className={`${BUTTON} cursor-not-allowed bg-sand-line text-ink-soft`}>
        Esgotado
      </button>
    );
  }

  function handleAdd() {
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

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={handleAdd}
        className={`${BUTTON} cursor-pointer bg-moss text-paper hover:bg-moss/90 hover:shadow-soft`}
      >
        <ShoppingBag className="size-5" aria-hidden="true" />
        Adicionar ao carrinho
      </button>
      <p aria-live="polite" className="text-sm text-ink-soft">
        {added && (
          <>
            Adicionado ·{' '}
            <Link href="/carrinho" className="font-semibold text-moss underline underline-offset-4">
              Ver carrinho
            </Link>
          </>
        )}
        {full && 'Seu carrinho já tem o máximo de produtos diferentes.'}
      </p>
    </div>
  );
}
