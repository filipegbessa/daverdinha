'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { ProductCategoryDialog } from '@/features/admin/components/ProductCategoryDialog';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import type { ProductCategoryAdmin } from '@/features/admin/types/admin';

export default function CategoriasProdutosPage() {
  const { apiFetch } = useApiClient();
  const { data: categories, isLoading, error, refetch } = useApiResource<ProductCategoryAdmin[]>('/product-categories');
  const remove = useApiMutation('Erro ao excluir categoria.');
  const [editing, setEditing] = useState<ProductCategoryAdmin | 'new' | null>(null);
  const [deleting, setDeleting] = useState<ProductCategoryAdmin | null>(null);

  async function handleConfirmDelete() {
    if (!deleting) return;
    const ok = await remove.run(() => apiFetch(`/product-categories/${deleting.id}`, { method: 'DELETE' }));
    if (ok) {
      setDeleting(null);
      refetch();
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Categorias de produto</h1>
        <Button onClick={() => setEditing('new')}>Nova categoria</Button>
      </div>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      {isLoading && <LoadingState />}
      {categories && categories.length === 0 && (
        <p className="mt-6 text-ink-soft">Nenhuma categoria ainda. Crie a primeira pra começar a cadastrar produtos.</p>
      )}
      {categories && categories.length > 0 && (
        <ul className="mt-6 space-y-2">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-sand-line p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {category.name}
                  {!category.active && <span className="ml-2 text-sm font-normal text-ink-soft">(Inativa)</span>}
                </p>
                <p className="truncate font-mono text-sm text-ink-soft">/produtos/{category.slug}</p>
              </div>
              <span className="text-sm text-ink-soft">{category._count.products} produto(s)</span>
              <Button variant="outline" onClick={() => setEditing(category)}>
                Editar
              </Button>
              <Button variant="destructive" onClick={() => setDeleting(category)}>
                Excluir
              </Button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <ProductCategoryDialog
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refetch();
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Excluir categoria "${deleting.name}"?`}
          isPending={remove.isPending}
          error={remove.error}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleting(null);
            remove.clearError();
          }}
        >
          <p>
            {deleting._count.products > 0
              ? `Essa categoria tem ${deleting._count.products} produto(s). Mova ou exclua os produtos antes.`
              : 'A página dessa categoria sai do site. Não dá pra desfazer.'}
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
