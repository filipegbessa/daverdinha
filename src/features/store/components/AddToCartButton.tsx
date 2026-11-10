'use client';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { SiteButton } from '@/features/site/components/SiteButton';
import { isSample } from '@/features/site/data/samples';
import { useAddToCart } from '@/features/store/lib/use-add-to-cart';
import type { Product } from '@/features/site/types/catalog';

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
      <SiteButton disabled className="w-full sm:w-auto">
        Esgotado
      </SiteButton>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <SiteButton onClick={addToCart} className="w-full sm:w-auto">
        <ShoppingBag className="size-5" aria-hidden="true" />
        Adicionar ao carrinho
      </SiteButton>
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
