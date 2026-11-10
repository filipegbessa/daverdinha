/**
 * Wraps content that is being refreshed (next page, reload after a save, a
 * toggle in flight): it stays on screen, dimmed and marked busy, instead of
 * either vanishing behind "Carregando..." or sitting there looking done.
 */
export function BusyRegion({
  busy,
  className = '',
  children,
}: {
  busy: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-busy={busy}
      className={`transition-opacity ${busy ? 'pointer-events-none cursor-wait opacity-50' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * The card list the admin uses for menu items, marcadores, produtos and
 * categorias. `empty` shows when there are no items, so no page forgets
 * to say so.
 */
export function AdminList({
  busy = false,
  empty,
  isEmpty,
  children,
}: {
  busy?: boolean;
  empty: React.ReactNode;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  if (isEmpty) return <p className="mt-6 text-muted-foreground">{empty}</p>;
  return (
    <BusyRegion busy={busy} className="mt-6">
      <ul className="space-y-2">{children}</ul>
    </BusyRegion>
  );
}

export function AdminListItem({ children }: { children: React.ReactNode }) {
  return <li className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">{children}</li>;
}
