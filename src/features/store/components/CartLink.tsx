'use client';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/features/store/components/CartProvider';

/** Ícone do carrinho no cabeçalho. O número só aparece depois de ler o carrinho salvo. */
export function CartLink() {
  const { count, ready } = useCart();
  const label = !ready || count === 0 ? 'Carrinho' : `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`;

  return (
    <Link
      href="/carrinho"
      aria-label={label}
      className="relative rounded-full p-2 text-ink transition-colors hover:bg-moss/10 hover:text-moss"
    >
      <ShoppingBag className="size-6" aria-hidden="true" />
      {ready && count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-berry px-1 text-xs font-semibold text-paper tabular-nums"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
