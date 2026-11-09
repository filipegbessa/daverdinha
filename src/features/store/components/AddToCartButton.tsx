'use client';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { isSample } from '@/features/site/data/samples';
import { useAddToCart } from '@/features/store/components/use-add-to-cart';
import type { Product } from '@/features/site/types/catalog';

const BUTTON =
  'inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold shadow-card transition-shadow sm:w-auto';

/**
 * O botão principal da página do produto com a loja ligada. Esgotado não vai
 * pro carrinho (o checkout responderia 409). Produto de exemplo vai, pra
 * cliente validar a loja na prévia: a cotação dele é montada no navegador
 * (`preview-quote.ts`) e o pagamento não é chamado. Depois de adicionar,
 * mostra por uns segundos o atalho pro carrinho.
 */
export function AddToCartButton({ product }: { product: Product }) {
  const { addToCart, added, full } = useAddToCart(product);

  if (product.availability === 'sold_out') {
    return (
      <button type="button" disabled className={`${BUTTON} cursor-not-allowed bg-sand-line text-ink-soft`}>
        Esgotado
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={addToCart}
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
      {isSample(product) && (
        <p className="text-xs text-ink-soft">Prévia: produto de exemplo, a compra não é finalizada.</p>
      )}
    </div>
  );
}
