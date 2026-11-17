'use client';
import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';
import { siteButtonClass } from '@/features/site/components/SiteButton';
import { QuantityStepper } from '@/features/store/components/QuantityStepper';
import { useCart } from '@/features/store/components/CartProvider';
import { MAX_ITEM_QUANTITY } from '@/features/store/lib/cart-storage';
import { formatPrice } from '@/lib/format';
import { PRODUCTS_HREF, productHref } from '@/features/site/lib/paths';

/** Páginas onde o próprio conteúdo já é o carrinho: lá o dropdown não abre sozinho. */
const CART_PAGES = ['/carrinho', '/checkout'];
/** A partir daqui (o `sm` do Tailwind) o dropdown abre sozinho ao adicionar. */
const DESKTOP = '(min-width: 640px)';

/**
 * O carrinho em dropdown, preso ao ícone do cabeçalho: os itens com foto,
 * quantidade e remover, o subtotal e os dois caminhos ("Finalizar compra" e
 * "Ver carrinho"), sem sair da página. No computador abre sozinho quando um
 * produto entra no carrinho, como confirmação; no celular não (abrir por
 * cima da página no meio da navegação atrapalha mais do que ajuda), e o
 * botão de adicionar já confirma ali mesmo.
 *
 * Painel não modal, posicionado por CSS embaixo do ícone (no celular, com a
 * largura da tela): fecha com Esc, com clique fora e ao seguir um link; ao
 * abrir o foco vai pro painel, ao fechar volta pro ícone. Feito à mão em vez
 * do Popover do Base UI, que trava o jsdom dos testes.
 *
 * Os preços são os que o site viu por último; o carrinho e o checkout
 * recotam com os de agora, por isso o rodapé avisa.
 */
export function CartDropdown() {
  const { items, count, ready, setQuantity, remove, lastAddedAt } = useCart();
  const [open, setOpen] = useState(false);
  const seenAddition = useRef(lastAddedAt);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const titleId = useId();

  useEffect(() => {
    if (lastAddedAt === seenAddition.current) return;
    seenAddition.current = lastAddedAt;
    if (CART_PAGES.includes(window.location.pathname)) return;
    if (typeof window.matchMedia === 'function' && window.matchMedia(DESKTOP).matches) setOpen(true);
  }, [lastAddedAt]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onPointerDown = (event: PointerEvent | MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  const label = !ready || count === 0 ? 'Carrinho' : `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div ref={rootRef} className="sm:relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="relative cursor-pointer rounded-full p-2 text-ink transition-colors hover:bg-moss/10 hover:text-moss focus-visible:outline-2 focus-visible:outline-moss"
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
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="absolute inset-x-4 top-full z-50 mt-2 flex max-h-[min(36rem,80dvh)] flex-col rounded-2xl border border-sand-line bg-paper text-ink shadow-soft outline-none sm:inset-x-auto sm:right-0 sm:w-96"
        >
          <div className="flex items-center justify-between gap-3 border-b border-sand-line px-4 py-3">
            <h2 id={titleId} className="font-serif text-lg font-semibold">
              Seu carrinho{count > 0 && <span className="text-ink-soft"> ({count})</span>}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Fechar o carrinho"
              className="flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-moss/10"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="space-y-3 px-4 py-6 text-center">
              <p className="text-ink-soft">Seu carrinho está vazio.</p>
              <Link
                href={PRODUCTS_HREF}
                onClick={() => setOpen(false)}
                className="font-semibold text-moss underline underline-offset-4"
              >
                Ver produtos
              </Link>
            </div>
          ) : (
            <>
              <ul
                aria-label="Itens do carrinho"
                className="min-h-0 flex-1 divide-y divide-sand-line overflow-y-auto px-4"
              >
                {items.map((item) => (
                  <li key={item.productId} className="flex gap-3 py-3">
                    <ImagePlaceholder
                      src={item.imageUrl ?? undefined}
                      alt=""
                      sizes="64px"
                      className="size-16 shrink-0 rounded-xl"
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={productHref({ slug: item.slug, category: { slug: item.categorySlug } })}
                          onClick={() => setOpen(false)}
                          className="text-sm font-semibold hover:underline"
                        >
                          {item.name}
                        </Link>
                        <span className="text-sm whitespace-nowrap tabular-nums">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <QuantityStepper
                          value={item.quantity}
                          max={MAX_ITEM_QUANTITY}
                          onChange={(quantity) => setQuantity(item.productId, quantity)}
                          label={`Quantidade de ${item.name}`}
                        />
                        <button
                          type="button"
                          onClick={() => remove(item.productId)}
                          aria-label={`Remover ${item.name}`}
                          className="flex size-9 cursor-pointer items-center justify-center rounded-full text-ink-soft hover:bg-berry/10 hover:text-berry"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="space-y-3 border-t border-sand-line px-4 py-4">
                <p className="flex justify-between font-semibold">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatPrice(subtotal)}</span>
                </p>
                <p className="text-xs text-ink-soft">Entrega, estoque e preço final conferidos no checkout.</p>
                <div className="grid gap-2">
                  <Link
                    href="/checkout"
                    onClick={() => setOpen(false)}
                    className={siteButtonClass({ className: 'w-full' })}
                  >
                    Finalizar compra
                  </Link>
                  <Link
                    href="/carrinho"
                    onClick={() => setOpen(false)}
                    className={siteButtonClass({ variant: 'secondary', className: 'w-full' })}
                  >
                    Ver carrinho
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
