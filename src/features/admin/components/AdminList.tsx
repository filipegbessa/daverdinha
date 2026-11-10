import { BusyRegion } from '@/features/admin/components/StatusMessage';

/** O aviso de lista vazia ("Nenhum produto ainda.", "... com esses filtros."). */
export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground">{children}</p>;
}

/**
 * A lista de cards do admin (itens de menu, marcadores, produtos, categorias,
 * pedidos). `empty` aparece quando não há itens, pra nenhuma página esquecer
 * de dizer isso; `busy` apaga a lista (ou o aviso) durante uma recarga.
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
  return (
    <BusyRegion busy={busy} className="mt-6">
      {isEmpty ? <EmptyState>{empty}</EmptyState> : <ul className="space-y-2">{children}</ul>}
    </BusyRegion>
  );
}

export function AdminListItem({ children }: { children: React.ReactNode }) {
  return <li className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">{children}</li>;
}
