'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { usePaginatedResource } from '@/features/admin/lib/use-paginated-resource';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { BackLink } from '@/features/admin/components/BackLink';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { FilterBar } from '@/features/admin/components/FilterBar';
import { AdminList, AdminListItem } from '@/features/admin/components/AdminList';
import { TablePagination } from '@/features/admin/components/TablePagination';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import { TicketScanner } from '@/features/admin/components/TicketScanner';
import type { Attendee, AttendeeList } from '@/features/admin/types/admin';

const DEFAULT_FILTERS = { q: '' };

/**
 * Lista de presença de um evento: só ingressos de pedidos pagos, em ordem
 * alfabética, com o check-in na entrada. O título do evento vem no link da
 * agenda (`?evento=`): a API não tem `GET /events/:id`.
 */
export default function ParticipantesPage() {
  // `useSearchParams` pede um Suspense em volta pra página poder ser gerada no build.
  return (
    <Suspense fallback={<LoadingState />}>
      <Attendees />
    </Suspense>
  );
}

function Attendees() {
  const { id } = useParams<{ id: string }>();
  const eventTitle = useSearchParams().get('evento');
  const { apiFetch } = useApiClient();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const q = useDebouncedValue(filters.q.trim());
  const {
    data,
    items: attendees,
    isLoading,
    isRefreshing,
    error,
    refetch,
    pagination,
  } = usePaginatedResource<Attendee, AttendeeList>(`/events/${id}/attendees`, { q: q || undefined });
  const checkIn = useApiMutation('Erro ao marcar a presença.');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  async function toggle(attendee: Attendee, checked: boolean) {
    setSavingId(attendee.id);
    const ok = await checkIn.run(() =>
      apiFetch(`/site-order-tickets/${attendee.id}/check-in`, {
        method: 'PATCH',
        body: JSON.stringify({ checkedIn: checked }),
      }),
    );
    setSavingId(null);
    if (ok) refetch();
  }

  const occupancy = data
    ? data.spots === null
      ? `${data.sold} inscritos`
      : `${data.sold} de ${data.spots} vagas`
    : null;

  return (
    <div>
      <BackLink href="/admin/agenda">Voltar para a agenda</BackLink>
      <PageHeader title="Participantes" description={occupancy && [eventTitle, occupancy].filter(Boolean).join(' · ')}>
        {!scanning && (
          <Button onClick={() => setScanning(true)}>
            <QrCode aria-hidden="true" />
            Ler QR
          </Button>
        )}
      </PageHeader>
      {scanning && <TicketScanner eventId={id} onCheckedIn={() => refetch()} onClose={() => setScanning(false)} />}
      <FilterBar values={filters} defaults={DEFAULT_FILTERS} onChange={setFilters}>
        {(values, set) => (
          <Input
            value={values.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Participante ou comprador"
            aria-label="Buscar participantes"
            className="w-56"
          />
        )}
      </FilterBar>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      {checkIn.error && <ErrorAlert>{checkIn.error}</ErrorAlert>}
      {isLoading && <LoadingState />}
      {data && (
        <AdminList
          busy={isRefreshing || checkIn.isPending}
          isEmpty={attendees.length === 0}
          empty={q ? 'Ninguém encontrado com essa busca.' : 'Nenhum ingresso pago ainda.'}
        >
          {attendees.map((attendee) => (
            <AdminListItem key={attendee.id}>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{attendee.attendeeName}</p>
                <p className="text-sm text-muted-foreground">
                  Comprado por {attendee.order.customerName} ·{' '}
                  <Link href={`/admin/pedidos/${attendee.order.id}`} className="text-primary underline">
                    {attendee.order.code}
                  </Link>
                </p>
              </div>
              <Switch
                checked={attendee.checkedInAt !== null}
                disabled={savingId === attendee.id}
                onCheckedChange={(checked) => toggle(attendee, checked)}
                aria-label={`${attendee.attendeeName} presente`}
              />
            </AdminListItem>
          ))}
        </AdminList>
      )}
      {pagination && <TablePagination {...pagination} itemLabel="participantes" />}
    </div>
  );
}
