'use client';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { SiteButton } from '@/features/site/components/SiteButton';
import { useStorePause } from '@/features/store/components/StoreEnabled';
import { useAddToCart } from '@/features/store/lib/use-add-to-cart';
import { pauseReturnText } from '@/features/store/lib/store-pause';
import type { Product } from '@/features/site/types/catalog';

/**
 * O botão principal da página do produto com a loja ligada. Esgotado não vai
 * pro carrinho (o checkout responderia 409). Depois de adicionar, mostra
 * por uns segundos o atalho pro carrinho. Com a loja em pausa, o produto
 * continua à mostra, mas o botão fica desligado.
 */
export function AddToCartButton({ product }: { product: Product }) {
  const { addToCart, added, full } = useAddToCart(product);
  const pause = useStorePause();

  if (pause) {
    return (
      <div className="space-y-2">
        <SiteButton disabled className="w-full sm:w-auto">
          Loja em pausa
        </SiteButton>
        <p className="text-sm text-ink-soft">{pauseReturnText(pause) ?? 'Não estamos recebendo pedidos agora.'}</p>
      </div>
    );
  }

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
    </div>
  );
}
