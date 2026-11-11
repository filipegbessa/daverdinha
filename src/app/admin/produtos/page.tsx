'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { usePaginatedResource } from '@/features/admin/lib/use-paginated-resource';
import { TablePagination } from '@/features/admin/components/TablePagination';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { FilterBar } from '@/features/admin/components/FilterBar';
import { AdminList, AdminListItem } from '@/features/admin/components/AdminList';
import { Badge } from '@/features/admin/components/Badge';
import { ProductDialog } from '@/features/admin/components/ProductDialog';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import { formatCurrency } from '@/lib/format';
import type { ProductAdmin, ProductCategoryAdmin } from '@/features/admin/types/admin';

/** Como o produto está pro site, em poucas palavras, na linha da lista. */
function stockLabel(product: ProductAdmin): string {
  if (product.stock === null) {
    return product.leadTimeDays ? `Sob encomenda · ${product.leadTimeDays} dias` : 'Sob encomenda · sem prazo';
  }
  return product.stock === 0 ? 'Esgotado' : `Estoque: ${product.stock}`;
}

const DEFAULT_FILTERS = { q: '', categoryId: '', active: '', featured: '' };

export default function ProdutosPage() {
  const { apiFetch } = useApiClient();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { categoryId, active, featured } = filters;
  const debouncedSearch = useDebouncedValue(filters.q.trim());
  const hasFilters = Boolean(debouncedSearch || categoryId || active || featured);
  const {
    data,
    items: products,
    isLoading,
    isRefreshing,
    error,
    refetch,
    pagination,
  } = usePaginatedResource<ProductAdmin>('/products', {
    q: debouncedSearch || undefined,
    categoryId: categoryId || undefined,
    active: active || undefined,
    featured: featured || undefined,
  });
  const { data: categories } = useApiResource<ProductCategoryAdmin[]>('/product-categories');

  const mutation = useApiMutation('Erro ao atualizar produto.');
  const [editing, setEditing] = useState<ProductAdmin | 'new' | null>(null);
  const [deleting, setDeleting] = useState<ProductAdmin | null>(null);
  // A toggle in flight and the reload after it both dim the list.
  const busy = mutation.isPending || isRefreshing;

  async function toggleActive(product: ProductAdmin) {
    // A rota é multipart (por causa das fotos) mesmo quando só o "ativo" muda.
    const form = new FormData();
    form.append('active', String(!product.active));
    const ok = await mutation.run(() => apiFetch(`/products/${product.id}`, { method: 'PATCH', body: form }));
    if (ok) refetch();
  }

  async function handleConfirmDelete() {
    if (!deleting) return;
    const ok = await mutation.run(() => apiFetch(`/products/${deleting.id}`, { method: 'DELETE' }));
    if (ok) {
      setDeleting(null);
      refetch();
    }
  }

  return (
    <div>
      <PageHeader title="Produtos">
        <Button onClick={() => setEditing('new')} disabled={!categories}>
          Novo produto
        </Button>
      </PageHeader>
      <FilterBar values={filters} defaults={DEFAULT_FILTERS} onChange={setFilters}>
        {(values, set) => (
          <>
            <Input
              value={values.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Buscar por nome"
              aria-label="Buscar produtos"
              className="w-56"
            />
            <NativeSelect
              value={values.categoryId}
              onChange={(e) => set({ categoryId: e.target.value })}
              aria-label="Filtrar por categoria"
              className="w-auto"
            >
              <option value="">Todas as categorias</option>
              {(categories ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              value={values.active}
              onChange={(e) => set({ active: e.target.value })}
              aria-label="Filtrar por situação"
              className="w-auto"
            >
              <option value="">No site e ocultos</option>
              <option value="true">Aparecem no site</option>
              <option value="false">Ocultos</option>
            </NativeSelect>
            <NativeSelect
              value={values.featured}
              onChange={(e) => set({ featured: e.target.value })}
              aria-label="Filtrar por destaque"
              className="w-auto"
            >
              <option value="">Com e sem destaque</option>
              <option value="true">Em destaque</option>
              <option value="false">Sem destaque</option>
            </NativeSelect>
          </>
        )}
      </FilterBar>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      {mutation.error && !deleting && <ErrorAlert>{mutation.error}</ErrorAlert>}
      {isLoading && <LoadingState />}
      {data && (
        <AdminList
          busy={busy}
          isEmpty={products.length === 0}
          empty={
            hasFilters
              ? 'Nenhum produto encontrado com esses filtros.'
              : 'Nenhum produto ainda. Os produtos cadastrados aqui aparecem no site.'
          }
        >
          {products.map((product) => (
            <AdminListItem key={product.id}>
              {product.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura de 48px no admin, não precisa do otimizador
                <img
                  src={product.images[0]}
                  alt=""
                  className="size-12 flex-none rounded-lg border border-border object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="size-12 flex-none rounded-lg border border-dashed border-border bg-muted"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {product.name}
                  {product.featured && (
                    <Badge size="sm" className="ml-2">
                      Destaque
                    </Badge>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {product.category.name} · {formatCurrency(product.price, 'BRL')}
                  {product.images.length === 0 && ' · sem foto'}
                  {` · ${stockLabel(product)}`}
                </p>
              </div>
              <Switch
                checked={product.active}
                onCheckedChange={() => toggleActive(product)}
                disabled={busy}
                aria-label={`Mostrar ${product.name} no site`}
              />
              <Button variant="outline" disabled={busy || !categories} onClick={() => setEditing(product)}>
                Editar
              </Button>
              <Button variant="destructive" disabled={busy} onClick={() => setDeleting(product)}>
                Remover
              </Button>
            </AdminListItem>
          ))}
        </AdminList>
      )}
      {pagination && <TablePagination {...pagination} itemLabel="produtos" />}
      {editing && categories && (
        <ProductDialog
          product={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refetch();
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Remover o produto "${deleting.name}"?`}
          confirmLabel="Remover produto"
          pendingLabel="Removendo..."
          isPending={mutation.isPending}
          error={mutation.error}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleting(null);
            mutation.clearError();
          }}
        >
          <p>
            O produto sai do site e desta lista. O cadastro fica guardado para os pedidos antigos continuarem mostrando
            o que foi vendido. Pra só esconder por um tempo, desligue a chave ao lado. Não dá pra desfazer.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
