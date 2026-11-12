'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { usePaginatedResource } from '@/features/admin/lib/use-paginated-resource';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { eventEndTime, formatCurrency, formatDateTime } from '@/lib/format';
import { TablePagination } from '@/features/admin/components/TablePagination';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { FilterBar } from '@/features/admin/components/FilterBar';
import { AdminList, AdminListItem } from '@/features/admin/components/AdminList';
import { Badge } from '@/features/admin/components/Badge';
import { EventDialog } from '@/features/admin/components/EventDialog';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import type { EventAdmin, StoreSettings } from '@/features/admin/types/admin';

const DEFAULT_FILTERS = { q: '' };

/**
 * A venda do evento em poucas palavras. Com o interruptor "Venda de
 * ingressos" do Dashboard desligado, nenhum evento vende, mesmo marcado.
 */
function salesLabel(event: EventAdmin, ticketsEnabled: boolean | undefined): string | null {
  if (!event.ticketSales) return null;
  if (ticketsEnabled === false) return 'Venda pausada no Dashboard';
  const unit = event.price === null || event.price === 0 ? 'inscritos' : 'vendidos';
  return event.spots === null ? `${event.sold} ${unit}` : `${event.sold} de ${event.spots} vagas`;
}

/**
 * A agenda do site: oficinas, feirinhas, aulas. Rascunho até publicar; evento
 * passado continua aqui (e a página dele no site), só sai da lista pública.
 */
export default function AgendaPage() {
  const { apiFetch } = useApiClient();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const q = useDebouncedValue(filters.q.trim());
  const {
    data,
    items: events,
    isLoading,
    isRefreshing,
    error,
    refetch,
    pagination,
  } = usePaginatedResource<EventAdmin>('/events', { q: q || undefined });
  // Só pra dizer "venda pausada": se falhar, a lista continua funcionando.
  const { data: storeSettings } = useApiResource<StoreSettings>('/store-settings');
  const remove = useApiMutation('Erro ao excluir o evento.');
  const [editing, setEditing] = useState<EventAdmin | 'new' | null>(null);
  const [deleting, setDeleting] = useState<EventAdmin | null>(null);
  const now = Date.now();

  async function handleConfirmDelete() {
    if (!deleting) return;
    const ok = await remove.run(() => apiFetch(`/events/${deleting.id}`, { method: 'DELETE' }));
    if (ok) {
      setDeleting(null);
      refetch();
    }
  }

  return (
    <div>
      <PageHeader title="Agenda">
        <Button onClick={() => setEditing('new')}>Novo evento</Button>
      </PageHeader>
      <FilterBar values={filters} defaults={DEFAULT_FILTERS} onChange={setFilters}>
        {(values, set) => (
          <Input
            value={values.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Buscar por título"
            aria-label="Buscar eventos"
            className="w-56"
          />
        )}
      </FilterBar>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      {isLoading && <LoadingState />}
      {data && (
        <AdminList
          busy={isRefreshing || remove.isPending}
          isEmpty={events.length === 0}
          empty={
            q
              ? 'Nenhum evento encontrado com essa busca.'
              : 'Nenhum evento ainda. Os eventos publicados aqui aparecem na agenda do site.'
          }
        >
          {events.map((event) => {
            const sales = salesLabel(event, storeSettings?.ticketsEnabled);
            const past = eventEndTime(event) < now;
            const details = [
              formatDateTime(event.startsAt),
              event.price === null ? 'Gratuito' : formatCurrency(event.price, 'BRL'),
              past ? 'Já aconteceu' : null,
              sales,
            ].filter(Boolean);
            return (
              <AdminListItem key={event.id}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {event.title}
                    <Badge size="sm" className="ml-2">
                      {event.published ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">{details.join(' · ')}</p>
                </div>
                {(event.ticketSales || event.sold > 0) && (
                  <Link
                    href={`/admin/agenda/${event.id}/participantes?evento=${encodeURIComponent(event.title)}`}
                    className={buttonVariants({ variant: 'outline' })}
                  >
                    Participantes
                  </Link>
                )}
                <Button variant="outline" disabled={remove.isPending} onClick={() => setEditing(event)}>
                  Editar
                </Button>
                <Button variant="destructive" disabled={remove.isPending} onClick={() => setDeleting(event)}>
                  Excluir
                </Button>
              </AdminListItem>
            );
          })}
        </AdminList>
      )}
      {pagination && <TablePagination {...pagination} itemLabel="eventos" />}
      {editing && (
        <EventDialog
          event={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refetch();
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Excluir o evento "${deleting.title}"?`}
          confirmLabel="Excluir evento"
          pendingLabel="Excluindo..."
          isPending={remove.isPending}
          error={remove.error}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleting(null);
            remove.clearError();
          }}
        >
          <p>
            O evento sai da agenda e a página dele deixa de existir. Pra só tirar do site, desligue
            &quot;Publicado&quot;. Não dá pra desfazer.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
