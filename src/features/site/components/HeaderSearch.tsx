'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';
import { ProductPrice } from '@/features/site/components/ProductPrice';
import { SEARCH_HREF } from '@/features/site/lib/paths';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import type { SearchSuggestion } from '@/app/busca/sugestoes/route';

/**
 * A lupa do cabeçalho. Abre uma barra embaixo do cabeçalho (igual à gaveta
 * do menu no celular), com sugestões enquanto a compradora digita; o
 * "Enter" leva pra página `/busca` com todos os resultados. Sem JS, a lupa
 * é só um link pra `/busca`.
 */
export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[] | null>(null);
  const term = useDebouncedValue(q.trim(), 250);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (term.length < 2) {
      setSuggestions(null);
      return;
    }
    const controller = new AbortController();
    fetch(`${SEARCH_HREF}/sugestoes?q=${encodeURIComponent(term)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: SearchSuggestion[]) => setSuggestions(data))
      .catch(() => {
        // Abortada por uma tecla nova, ou sem rede: o "Enter" ainda funciona.
      });
    return () => controller.abort();
  }, [term]);

  return (
    <div>
      <Link
        href={SEARCH_HREF}
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-label={open ? 'Fechar busca' : 'Buscar produtos'}
        className="flex cursor-pointer rounded-full p-2 text-ink hover:bg-moss/10"
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Search className="size-5" aria-hidden="true" />}
      </Link>
      {open && (
        <div className="absolute inset-x-0 top-full border-b border-moss-line bg-paper px-4 py-4 shadow-card md:px-6">
          <div className="mx-auto max-w-2xl">
            <form action={SEARCH_HREF} method="get" role="search">
              <label htmlFor={`${listId}-q`} className="sr-only">
                Buscar produtos
              </label>
              <input
                ref={inputRef}
                id={`${listId}-q`}
                type="search"
                name="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar vaso, planta, kit..."
                maxLength={100}
                autoComplete="off"
                aria-controls={listId}
                className="w-full rounded-full border border-moss-line bg-paper px-4 py-2 text-ink placeholder:text-ink-soft/70 focus-visible:outline-2 focus-visible:outline-moss"
              />
            </form>
            <div id={listId} aria-live="polite">
              {suggestions && suggestions.length === 0 && (
                <p className="mt-3 px-1 text-sm text-ink-soft">Nenhum produto com “{term}”.</p>
              )}
              {suggestions && suggestions.length > 0 && (
                <ul className="mt-2 divide-y divide-moss-line/60">
                  {suggestions.map((s) => (
                    <li key={s.href}>
                      <Link
                        href={s.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-moss/5"
                      >
                        <ImagePlaceholder
                          src={s.image ?? undefined}
                          alt=""
                          sizes="40px"
                          className="size-10 shrink-0 rounded-md"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{s.name}</span>
                          <span className="block text-xs text-ink-soft">{s.category}</span>
                        </span>
                        <ProductPrice product={s} />
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href={`${SEARCH_HREF}?q=${encodeURIComponent(term)}`}
                      onClick={() => setOpen(false)}
                      className="block px-1 py-2 text-sm font-medium text-moss hover:underline"
                    >
                      Ver todos os resultados
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
