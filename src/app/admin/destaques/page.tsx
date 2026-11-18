'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ImageOff } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { heroSlideStatus } from '@/features/admin/lib/hero-slide-status';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { AdminList, AdminListItem } from '@/features/admin/components/AdminList';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import type { HeroSlideAdmin } from '@/features/admin/types/admin';

/**
 * Os destaques do topo da home, na ordem em que aparecem. São poucos, então a
 * lista não é paginada e a ordem muda pelas setas, como no menu do bot.
 */
export default function DestaquesPage() {
  const { apiFetch } = useApiClient();
  const { data: slides, isLoading, isRefreshing, error, refetch } = useApiResource<HeroSlideAdmin[]>('/hero-slides');
  const mutation = useApiMutation('Erro ao atualizar o destaque.');
  const [deleting, setDeleting] = useState<HeroSlideAdmin | null>(null);
  const busy = mutation.isPending || isRefreshing;
  const liveCount = slides?.filter((slide) => slide.live).length ?? 0;

  async function mutate(action: () => Promise<unknown>) {
    const ok = await mutation.run(action);
    if (ok) refetch();
    return ok;
  }

  function toggleActive(slide: HeroSlideAdmin) {
    const form = new FormData();
    form.append('active', String(!slide.active));
    return mutate(() => apiFetch(`/hero-slides/${slide.id}`, { method: 'PATCH', body: form }));
  }

  function move(index: number, direction: -1 | 1) {
    if (!slides) return;
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const reordered = [...slides];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    return mutate(() =>
      apiFetch('/hero-slides/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ orderedIds: reordered.map((slide) => slide.id) }),
      }),
    );
  }

  async function confirmDelete() {
    if (!deleting) return;
    const ok = await mutate(() => apiFetch(`/hero-slides/${deleting.id}`, { method: 'DELETE' }));
    if (ok) setDeleting(null);
  }

  return (
    <div>
      <PageHeader title="Destaques">
        <Link href="/admin/destaques/novo" className={buttonVariants()}>
          Novo destaque
        </Link>
      </PageHeader>
      <p className="mt-2 text-sm text-muted-foreground">
        Os slides do topo da home, nesta ordem. Sem nenhum na home, o site mostra o slide padrão; com um só, ele fica
        parado.
        {slides && ` ${liveCount === 1 ? '1 está' : `${liveCount} estão`} na home agora.`}
      </p>
      {isLoading && <LoadingState />}
      {!isLoading && !slides && <ErrorAlert>{error ?? 'Não foi possível carregar os destaques.'}</ErrorAlert>}
      {mutation.error && <ErrorAlert>{mutation.error}</ErrorAlert>}
      {slides && (
        <div className="mt-4">
          <AdminList busy={busy} isEmpty={slides.length === 0} empty="Nenhum destaque cadastrado.">
            {slides.map((slide, index) => (
              <AdminListItem key={slide.id}>
                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Mover ${slide.title} pra cima`}
                    disabled={busy || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ChevronUp aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Mover ${slide.title} pra baixo`}
                    disabled={busy || index === slides.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ChevronDown aria-hidden="true" />
                  </Button>
                </div>
                {slide.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- miniatura no admin, sem otimizador
                  <img src={slide.imageUrl} alt="" className="hidden h-12 w-20 rounded object-cover sm:block" />
                ) : (
                  <div className="hidden h-12 w-20 items-center justify-center rounded bg-muted text-muted-foreground sm:flex">
                    <ImageOff className="size-4" aria-hidden="true" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{slide.title}</p>
                  <p className="text-sm text-muted-foreground">{heroSlideStatus(slide)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Switch
                    checked={slide.active}
                    onCheckedChange={() => toggleActive(slide)}
                    disabled={busy}
                    aria-label={`Ativar ${slide.title}`}
                  />
                  <Link href={`/admin/destaques/${slide.id}`} className={buttonVariants({ variant: 'outline' })}>
                    Editar
                  </Link>
                  <Button variant="destructive" disabled={busy} onClick={() => setDeleting(slide)}>
                    Excluir
                  </Button>
                </div>
              </AdminListItem>
            ))}
          </AdminList>
        </div>
      )}
      {deleting && (
        <ConfirmDialog
          title={`Excluir o destaque "${deleting.title}"?`}
          isPending={mutation.isPending}
          error={mutation.error}
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleting(null);
            mutation.clearError();
          }}
        >
          <p>O slide sai da home e a foto dele é apagada. Pra só tirar da home, desligue. Não dá pra desfazer.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
