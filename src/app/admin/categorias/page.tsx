'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { ProductCategoryDialog } from '@/features/admin/components/ProductCategoryDialog';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { FilterBar, PageHeader } from '@/features/admin/components/PageHeader';
import { AdminList, AdminListItem } from '@/features/admin/components/AdminList';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import { normalizeSearch } from '@/features/admin/lib/normalize-search';
import type { ProductCategoryAdmin } from '@/features/admin/types/admin';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function CategoriasPage() {
  const { apiFetch } = useApiClient();
  const { data: categories, isLoading, isRefreshing, error, refetch } =
    useApiResource<ProductCategoryAdmin[]>('/product-categories');
  const remove = useApiMutation('Erro ao excluir categoria.');
  const [editing, setEditing] = useState<ProductCategoryAdmin | 'new' | null>(null);
  const [deleting, setDeleting] = useState<ProductCategoryAdmin | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  // São poucas e a API devolve todas de uma vez, então o filtro é aqui mesmo.
  const query = normalizeSearch(search);
  const visible = (categories ?? []).filter(
    (category) =>
      normalizeSearch(category.name).includes(query) &&
      (status === 'all' || category.active === (status === 'active')),
  );

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
      <PageHeader title="Categorias">
        <Button onClick={() => setEditing('new')}>Nova categoria</Button>
      </PageHeader>
      <FilterBar>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome"
          aria-label="Buscar categorias"
          className="w-56"
        />
        <NativeSelect
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          aria-label="Filtrar por situação"
          className="w-auto"
        >
          <option value="all">No site e ocultas</option>
          <option value="active">Aparecem no site</option>
          <option value="inactive">Ocultas</option>
        </NativeSelect>
      </FilterBar>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      {isLoading && <LoadingState />}
      {categories && (
        <AdminList
          busy={isRefreshing}
          isEmpty={visible.length === 0}
          empty={
            categories.length === 0
              ? 'Nenhuma categoria ainda. Crie a primeira pra começar a cadastrar produtos.'
              : 'Nenhuma categoria encontrada com esses filtros.'
          }
        >
          {visible.map((category) => (
            <AdminListItem key={category.id}>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{category.name}</p>
                <p className="text-sm text-ink-soft">
                  {category.active ? 'Aparece no site' : 'Oculta'}
                  {category.order > 0 && ` · Ordem ${category.order}`}
                  {` · ${category._count.products} produto(s)`}
                </p>
              </div>
              <Button variant="outline" onClick={() => setEditing(category)}>
                Editar
              </Button>
              <Button variant="destructive" onClick={() => setDeleting(category)}>
                Excluir
              </Button>
            </AdminListItem>
          ))}
        </AdminList>
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
