'use client';
import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, X } from 'lucide-react';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';
import { siteButtonClass } from '@/features/site/components/SiteButton';
import { useCart } from '@/features/store/components/CartProvider';
import { formatPrice } from '@/lib/format';
import { productHref } from '@/features/site/lib/paths';

/** Páginas onde o próprio conteúdo já é o carrinho: lá o painel não abre. */
const CART_PAGES = ['/carrinho', '/checkout'];
/** Só onde dá pra passar o mouse e há espaço: no celular o ícone só leva pro carrinho. */
const HOVER_SCREEN = '(hover: hover) and (min-width: 640px)';
/** Depois de abrir sozinho (produto adicionado), fecha se ninguém mexer. */
const AUTO_CLOSE_MS = 4000;
/** Folga pra o mouse sair do ícone e chegar no painel sem ele fechar. */
const LEAVE_DELAY_MS = 150;

function hoverScreen(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(HOVER_SCREEN).matches;
}

/**
 * O ícone do carrinho no cabeçalho. Clicar sempre leva pra `/carrinho`. No
 * computador, passar o mouse abre um painel compacto com os itens (foto,
 * nome, quantidade × preço, remover), o subtotal e "Finalizar compra"; ele
 * também abre sozinho por uns segundos quando um produto entra no carrinho.
 * No celular não há painel: o toque vai direto pro carrinho, e o botão de
 * adicionar já confirma ali mesmo.
 *
 * Os preços são os que o site viu por último; o carrinho e o checkout
 * recotam com os de agora.
 */
export function CartDropdown() {
  const { items, count, ready, remove, lastAddedAt } = useCart();
  const [open, setOpen] = useState(false);
  const seenAddition = useRef(lastAddedAt);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();

  function clearTimers() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
  }

  useEffect(() => clearTimers, []);

  useEffect(() => {
    if (lastAddedAt === seenAddition.current) return;
    seenAddition.current = lastAddedAt;
    if (CART_PAGES.includes(window.location.pathname) || !hoverScreen()) return;
    clearTimers();
    setOpen(true);
    autoCloseTimer.current = setTimeout(() => setOpen(false), AUTO_CLOSE_MS);
  }, [lastAddedAt]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function show() {
    if (!hoverScreen() || CART_PAGES.includes(window.location.pathname)) return;
    clearTimers();
    setOpen(true);
  }

  function hide() {
    clearTimers();
    leaveTimer.current = setTimeout(() => setOpen(false), LEAVE_DELAY_MS);
  }

  const label = !ready || count === 0 ? 'Carrinho' : `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <Link
        href="/carrinho"
        aria-label={label}
        aria-describedby={open ? panelId : undefined}
        className="relative block rounded-full p-2 text-ink transition-colors hover:bg-moss/10 hover:text-moss"
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

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Resumo do carrinho"
          className="absolute top-full right-0 z-50 mt-2 w-80 rounded-xl border border-sand-line bg-paper text-sm text-ink shadow-soft"
        >
          {items.length === 0 ? (
            <p className="px-4 py-4 text-center text-ink-soft">Seu carrinho está vazio.</p>
          ) : (
            <>
              <ul aria-label="Itens do carrinho" className="max-h-64 divide-y divide-sand-line overflow-y-auto px-3">
                {items.map((item) => (
                  <li key={item.productId} className="flex items-center gap-3 py-2">
                    <ImagePlaceholder
                      src={item.imageUrl ?? undefined}
                      alt=""
                      sizes="40px"
                      className="size-10 shrink-0 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={productHref({ slug: item.slug, category: { slug: item.categorySlug } })}
                        className="block truncate font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-ink-soft tabular-nums">
                        {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.productId)}
                      aria-label={`Remover ${item.name}`}
                      className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-soft hover:bg-berry/10 hover:text-berry"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="space-y-2 border-t border-sand-line px-3 py-3">
                <p className="flex justify-between font-semibold">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatPrice(subtotal)}</span>
                </p>
                <Link href="/checkout" className={siteButtonClass({ size: 'sm', className: 'w-full' })}>
                  Finalizar compra
                </Link>
                <Link href="/carrinho" className="block text-center text-xs font-semibold text-moss underline">
                  Ver carrinho
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
