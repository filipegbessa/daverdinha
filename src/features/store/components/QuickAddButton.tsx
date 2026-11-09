'use client';
import { Check, ShoppingBag } from 'lucide-react';
import { useAddToCart } from '@/features/store/components/use-add-to-cart';
import type { Product } from '@/features/site/types/catalog';

const BUTTON =
  'inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors';

/**
 * O "adicionar" do card de produto (home, `/produtos`, categoria e
 * relacionados), pra comprar sem abrir a página do produto. Mesma regra do
 * botão grande: 1 unidade, esgotado não entra. A confirmação fica no próprio
 * botão por uns segundos, e o número no ícone do carrinho do topo sobe junto.
 * O nome do produto vai no nome acessível, porque a página tem vários.
 */
export function QuickAddButton({ product }: { product: Product }) {
  const { addToCart, added, full } = useAddToCart(product);

  if (product.availability === 'sold_out') {
    return (
      <button type="button" disabled className={`${BUTTON} cursor-not-allowed bg-sand-line text-ink-soft`}>
        Esgotado
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={addToCart}
        aria-label={`Adicionar ${product.name} ao carrinho`}
        className={`${BUTTON} cursor-pointer bg-moss text-paper hover:bg-moss/90`}
      >
        {added ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <ShoppingBag className="size-4" aria-hidden="true" />
        )}
        {added ? 'Adicionado' : 'Adicionar'}
      </button>
      <p aria-live="polite" className="mt-1.5 text-xs text-ink-soft empty:hidden">
        {added && <span className="sr-only">{product.name} adicionado ao carrinho.</span>}
        {full && 'Seu carrinho já tem o máximo de produtos diferentes.'}
      </p>
    </>
  );
}
