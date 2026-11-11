'use client';
import { useState } from 'react';
import { SlidersHorizontal, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/components/ui/sheet';

export type FilterValues = Record<string, unknown>;

/** Onde os controles estão sendo desenhados: na linha (desktop) ou na gaveta (celular). */
export type FilterLayout = 'inline' | 'sheet';

/**
 * Quantos valores estão diferentes do padrão. Busca só com espaços conta como
 * vazia, igual à página, que faz `trim()` antes de mandar pra API.
 */
export function countActiveFilters<V extends FilterValues>(values: V, defaults: V): number {
  const normalize = (value: unknown) => (typeof value === 'string' ? value.trim() : value);
  return Object.keys(defaults).filter((key) => normalize(values[key]) !== normalize(defaults[key])).length;
}

function activeLabel(count: number) {
  if (count === 0) return 'Filtros';
  return `Filtros (${count} ${count === 1 ? 'ativo' : 'ativos'})`;
}

/**
 * A busca e os filtros de uma lista do admin, embaixo do `PageHeader`.
 *
 * A página guarda um objeto só (`values`) e desenha os controles uma vez, no
 * `children(values, set, layout)`. No desktop (md+) eles ficam na linha e
 * cada mudança vale na hora. No celular a linha vira um botão "Filtros" (com
 * a contagem do que está diferente do padrão) que abre uma gaveta à direita:
 * lá as mudanças são um rascunho, que só vale no "Aplicar"; "Redefinir" volta
 * tudo pro `defaults`; fechar (X, fundo, Esc) descarta o rascunho.
 *
 * Os controles da gaveta só existem enquanto ela está aberta, então fechada
 * há uma cópia só de cada controle na página.
 */
export function FilterBar<V extends FilterValues>({
  values,
  defaults,
  onChange,
  children,
}: {
  values: V;
  defaults: V;
  onChange: (values: V) => void;
  children: (values: V, set: (patch: Partial<V>) => void, layout: FilterLayout) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // O rascunho da gaveta: começa com os valores aplicados a cada abertura.
  const [draft, setDraft] = useState<V>(values);
  const count = countActiveFilters(values, defaults);

  function apply(next: V) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div className="mt-4">
      <div role="search" className="hidden flex-wrap items-center gap-2 md:flex">
        {children(values, (patch) => onChange({ ...values, ...patch }), 'inline')}
      </div>
      <div className="md:hidden">
        <Button
          variant="outline"
          aria-label={activeLabel(count)}
          onClick={() => {
            setDraft(values);
            setOpen(true);
          }}
        >
          <span className="relative">
            <SlidersHorizontal aria-hidden="true" />
            {count > 0 && (
              <span
                aria-hidden="true"
                data-testid="filter-count"
                className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] leading-none font-semibold text-primary-foreground"
              >
                {count}
              </span>
            )}
          </span>
          Filtros
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <form
            role="search"
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              apply(draft);
            }}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b py-3 pr-2 pl-4">
              <SheetTitle>Filtros</SheetTitle>
              <SheetClose render={<Button type="button" variant="ghost" size="icon-sm" aria-label="Fechar filtros" />}>
                <XIcon aria-hidden="true" />
              </SheetClose>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 *:w-full!">
              {children(draft, (patch) => setDraft((current) => ({ ...current, ...patch })), 'sheet')}
            </div>
            <div className="flex shrink-0 justify-end gap-2 border-t bg-muted/50 p-4">
              <Button type="button" variant="outline" onClick={() => apply(defaults)}>
                Redefinir
              </Button>
              <Button type="submit">Aplicar</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
