'use client';
import { Suspense, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { heroSlideStatus } from '@/features/admin/lib/hero-slide-status';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { BackLink } from '@/features/admin/components/BackLink';
import { HeroSlideForm } from '@/features/admin/components/HeroSlideForm';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import type { HeroSlideAdmin } from '@/features/admin/types/admin';

function DestaqueEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const justCreated = useSearchParams().get('criado') === '1';
  const { apiFetch } = useApiClient();
  const { data: slide, isLoading, error } = useApiResource<HeroSlideAdmin>(`/hero-slides/${encodeURIComponent(id)}`);
  const remove = useApiMutation('Erro ao excluir o destaque.');
  const [deleting, setDeleting] = useState(false);
  const [current, setCurrent] = useState<HeroSlideAdmin | null>(null);
  const shown = current ?? slide;
  const back = <BackLink href="/admin/destaques">Voltar para destaques</BackLink>;

  if (!shown) {
    return (
      <div>
        {back}
        <PageHeader title="Destaque" />
        {isLoading || !error ? <LoadingState /> : <ErrorAlert>{error}</ErrorAlert>}
      </div>
    );
  }

  async function handleConfirmDelete() {
    const ok = await remove.run(() => apiFetch(`/hero-slides/${encodeURIComponent(id)}`, { method: 'DELETE' }));
    if (ok) router.push('/admin/destaques');
  }

  return (
    <div>
      {back}
      <PageHeader title={shown.title}>
        <Button variant="destructive" onClick={() => setDeleting(true)}>
          <Trash2 aria-hidden="true" />
          Excluir
        </Button>
      </PageHeader>
      <p className="mt-2 text-sm text-muted-foreground">{heroSlideStatus(shown)}</p>
      <div className="mt-6">
        <HeroSlideForm
          key={shown.id}
          slide={shown}
          notice={justCreated ? 'Destaque criado.' : null}
          onSaved={setCurrent}
        />
      </div>
      {deleting && (
        <ConfirmDialog
          title={`Excluir o destaque "${shown.title}"?`}
          confirmLabel="Excluir destaque"
          pendingLabel="Excluindo..."
          isPending={remove.isPending}
          error={remove.error}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleting(false);
            remove.clearError();
          }}
        >
          <p>O slide sai da home e a foto dele é apagada. Pra só tirar da home, desligue. Não dá pra desfazer.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}

export default function DestaquePage() {
  // `useSearchParams` ("Destaque criado.") pede um Suspense em volta.
  return (
    <Suspense fallback={<LoadingState />}>
      <DestaqueEditor />
    </Suspense>
  );
}
