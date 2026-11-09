'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';
import { formatPrice } from '@/features/site/lib/format';
import { PRODUCTS_HREF, productHref } from '@/features/site/lib/paths';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { useCart } from '@/features/store/components/CartProvider';
import { MAX_ITEM_QUANTITY, type CartItem } from '@/features/store/lib/cart-storage';
import { quoteCart } from '@/features/store/lib/store-api';
import type { CheckoutQuote } from '@/features/store/types/store';

type Problem = CheckoutQuote['problems'][number];

function problemText(problem: Problem): string {
  if (problem.reason !== 'insufficient_stock') return 'Não está mais disponível';
  if (!problem.available) return 'Esgotado';
  return problem.available === 1 ? 'Só resta 1' : `Só restam ${problem.available}`;
}

/** A chave do que muda a cotação: produtos e quantidades, não nome nem preço salvos. */
function cartKey(items: CartItem[]): string {
  return items.map((i) => `${i.productId}:${i.quantity}`).join(',');
}

/**
 * O carrinho com os preços e o estoque de agora. Recota (com uma pequena
 * espera, pra não chamar a API a cada clique no "+") sempre que um produto
 * ou quantidade muda, e só libera "Finalizar compra" com a cotação em dia e
 * sem nenhum problema.
 */
export function CartView() {
  const { items, ready, setQuantity, remove, syncFromQuote } = useCart();
  const key = cartKey(items);
  const debouncedKey = useDebouncedValue(key, 400);
  const [quote, setQuote] = useState<{ key: string; data: CheckoutQuote } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!ready || debouncedKey === '' || debouncedKey !== key) return;
    let cancelled = false;
    setFailed(false);
    const requested = items.map(({ productId, quantity }) => ({ productId, quantity }));
    quoteCart(requested).then((data) => {
      if (cancelled) return;
      if (!data) {
        setFailed(true);
        return;
      }
      setQuote({ key: debouncedKey, data });
      syncFromQuote(data);
    });
    return () => {
      cancelled = true;
    };
    // `items` muda junto com `key`; recotar quando nome/preço salvos mudam
    // (o `syncFromQuote` logo acima) entraria em loop.
  }, [ready, debouncedKey, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (!ready) {
    return <p className="text-ink-soft">Carregando seu carrinho...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-sand-line bg-sand/60 p-8 text-center">
        <p className="font-serif text-xl text-ink">Seu carrinho está vazio.</p>
        <Link
          href={PRODUCTS_HREF}
          className="mt-4 inline-block font-semibold text-moss underline underline-offset-4"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  const current = quote?.key === key ? quote.data : null;
  const updating = !current && !failed;
  const problems = current?.problems ?? [];
  const canCheckout = current !== null && problems.length === 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <ul className="divide-y divide-sand-line border-y border-sand-line">
        {items.map((item) => {
          const line = current?.items.find((l) => l.productId === item.productId);
          const problem = problems.find((p) => p.productId === item.productId);
          const href = productHref({ slug: item.slug, category: { slug: item.categorySlug } });
          return (
            <li key={item.productId} className="flex gap-4 py-4">
              <Link href={href} className="shrink-0">
                <ImagePlaceholder
                  src={item.imageUrl ?? undefined}
                  alt={item.name}
                  sizes="96px"
                  className="size-24 rounded-xl"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={href} className="font-medium text-berry hover:underline">
                  {item.name}
                </Link>
                <p className="text-sm text-ink-soft tabular-nums">{formatPrice(line?.unitPrice ?? item.price)} cada</p>
                {line?.availability === 'made_to_order' && (
                  <p className="text-sm text-ink-soft">
                    Sob encomenda{line.leadTimeDays ? ` · até ${line.leadTimeDays} dias` : ''}
                  </p>
                )}
                {problem && <p className="mt-1 text-sm font-semibold text-berry">{problemText(problem)}</p>}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-moss-line">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label={`Diminuir quantidade de ${item.name}`}
                      className="cursor-pointer p-2 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </button>
                    <span className="min-w-8 text-center tabular-nums" aria-label={`Quantidade de ${item.name}`}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= MAX_ITEM_QUANTITY}
                      aria-label={`Aumentar quantidade de ${item.name}`}
                      className="cursor-pointer p-2 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.productId)}
                    aria-label={`Remover ${item.name}`}
                    className="cursor-pointer rounded-full p-2 text-ink-soft hover:bg-berry/10 hover:text-berry"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <p className="font-semibold text-ink tabular-nums">
                {line ? formatPrice(line.lineTotal) : formatPrice(item.price * item.quantity)}
              </p>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit rounded-2xl border border-sand-line bg-sand/60 p-5">
        <h2 className="font-serif text-xl font-semibold text-ink">Resumo</h2>
        <div aria-live="polite" className="mt-4 space-y-2">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold tabular-nums">{current ? formatPrice(current.subtotal) : '—'}</span>
          </p>
          <p className="text-sm text-ink-soft">Frete calculado no próximo passo.</p>
          {current && current.installments > 1 && (
            <p className="text-sm text-ink-soft">Pix ou cartão em até {current.installments}x sem juros.</p>
          )}
          {updating && <p className="text-sm text-ink-soft">Atualizando preços...</p>}
          {problems.length > 0 && (
            <p className="text-sm font-semibold text-berry">Ajuste os itens marcados pra continuar.</p>
          )}
          {failed && (
            <p className="text-sm text-berry">
              Não foi possível atualizar os preços agora.{' '}
              <button type="button" onClick={retry} className="cursor-pointer font-semibold underline">
                Tentar de novo
              </button>
            </p>
          )}
        </div>
        {canCheckout ? (
          <Link
            href="/checkout"
            onClick={() =>
              window.gtag?.('event', 'begin_checkout', {
                currency: 'BRL',
                value: current.subtotal,
                items: current.items.map((l) => ({
                  item_id: l.productId,
                  item_name: l.name,
                  price: l.unitPrice,
                  quantity: l.quantity,
                })),
              })
            }
            className="mt-5 flex w-full items-center justify-center rounded-full bg-moss px-6 py-3.5 font-semibold text-paper shadow-card transition-shadow hover:bg-moss/90 hover:shadow-soft"
          >
            Finalizar compra
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="mt-5 flex w-full cursor-not-allowed items-center justify-center rounded-full bg-sand-line px-6 py-3.5 font-semibold text-ink-soft"
          >
            Finalizar compra
          </button>
        )}
      </aside>
    </div>
  );
}
