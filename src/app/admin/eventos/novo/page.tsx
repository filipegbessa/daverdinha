'use client';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { BackLink } from '@/features/admin/components/BackLink';
import { EventForm } from '@/features/admin/components/EventForm';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import type { EventAdmin } from '@/features/admin/types/admin';

/**
 * Novo evento. Com `?duplicar=<id>`, começa com os dados daquele evento
 * (título com "(cópia)", rascunho, sem datas e sem capa): uma oficina que se
 * repete só muda a data e a foto é escolhida de novo.
 */
function NovoEvento() {
  const router = useRouter();
  const sourceId = useSearchParams().get('duplicar');
  const { data: source, error } = useApiResource<EventAdmin>(
    sourceId ? `/events/${encodeURIComponent(sourceId)}/admin` : null,
  );
  const title = sourceId ? 'Duplicar evento' : 'Novo evento';
  const header = (
    <>
      <BackLink href="/admin/eventos">Voltar para eventos</BackLink>
      <PageHeader title={title} />
    </>
  );

  if (error) {
    return (
      <div>
        {header}
        <ErrorAlert>{error}</ErrorAlert>
      </div>
    );
  }
  if (sourceId && !source) {
    return (
      <div>
        {header}
        <LoadingState />
      </div>
    );
  }

  return (
    <div>
      {header}
      {source && (
        <p className="mt-2 text-sm text-muted-foreground">
          Cópia de “{source.title}”, como rascunho. Escolha a data e a foto: elas não são copiadas.
        </p>
      )}
      <div className="mt-6">
        <EventForm
          event={null}
          initial={
            source
              ? {
                  ...source,
                  id: undefined,
                  title: `${source.title} (cópia)`,
                  startsAt: undefined,
                  endsAt: null,
                  published: false,
                  imageUrl: null,
                }
              : undefined
          }
          onSaved={(created) => router.push(`/admin/eventos/${created.id}?criado=1`)}
        />
      </div>
    </div>
  );
}

export default function NovoEventoPage() {
  // `useSearchParams` precisa de um Suspense em volta pra página poder ser gerada no build.
  return (
    <Suspense fallback={<LoadingState />}>
      <NovoEvento />
    </Suspense>
  );
}
