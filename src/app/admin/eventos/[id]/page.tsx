'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Copy, ExternalLink, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { BackLink } from '@/features/admin/components/BackLink';
import { EventForm } from '@/features/admin/components/EventForm';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import type { EventAdmin } from '@/features/admin/types/admin';

/**
 * Editar um evento, em página própria. No topo: ver no site (publicado),
 * duplicar e excluir. Evento com ingresso vendido não pode ser excluído (a
 * API responde 409 e a mensagem aparece na confirmação): despublique.
 */
function EventoEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const justCreated = useSearchParams().get('criado') === '1';
  const { apiFetch } = useApiClient();
  const { data: event, isLoading, error } = useApiResource<EventAdmin>(`/events/${encodeURIComponent(id)}/admin`);
  const remove = useApiMutation('Erro ao excluir o evento.');
  const [deleting, setDeleting] = useState(false);
  const [current, setCurrent] = useState<EventAdmin | null>(null);
  const shown = current ?? event;
  const back = <BackLink href="/admin/eventos">Voltar para eventos</BackLink>;

  if (!shown) {
    return (
      <div>
        {back}
        <PageHeader title="Evento" />
        {isLoading || !error ? <LoadingState /> : <ErrorAlert>{error}</ErrorAlert>}
      </div>
    );
  }

  async function handleConfirmDelete() {
    const ok = await remove.run(() => apiFetch(`/events/${encodeURIComponent(id)}`, { method: 'DELETE' }));
    if (ok) router.push('/admin/eventos');
  }

  return (
    <div>
      {back}
      <PageHeader title={shown.title}>
        <div className="flex flex-wrap gap-2">
          {shown.published && (
            <a
              href={`/agenda/${shown.slug}`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: 'outline' })}
            >
              <ExternalLink aria-hidden="true" />
              Ver no site
            </a>
          )}
          <Link
            href={`/admin/eventos/novo?duplicar=${encodeURIComponent(shown.id)}`}
            className={buttonVariants({ variant: 'outline' })}
          >
            <Copy aria-hidden="true" />
            Duplicar
          </Link>
          <Button variant="destructive" onClick={() => setDeleting(true)}>
            <Trash2 aria-hidden="true" />
            Excluir
          </Button>
        </div>
      </PageHeader>
      <div className="mt-6">
        <EventForm key={shown.id} event={shown} notice={justCreated ? 'Evento criado.' : null} onSaved={setCurrent} />
      </div>
      {deleting && (
        <ConfirmDialog
          title={`Excluir o evento "${shown.title}"?`}
          confirmLabel="Excluir evento"
          pendingLabel="Excluindo..."
          isPending={remove.isPending}
          error={remove.error}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleting(false);
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

export default function EventoPage() {
  // `useSearchParams` ("Evento criado.") pede um Suspense em volta.
  return (
    <Suspense fallback={<LoadingState />}>
      <EventoEditor />
    </Suspense>
  );
}
