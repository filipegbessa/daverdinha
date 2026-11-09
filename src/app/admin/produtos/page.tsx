'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { useDebouncedValue } from '@/features/admin/lib/use-debounced-value';
import { usePaginatedResource } from '@/features/admin/lib/use-paginated-resource';
import { TablePagination } from '@/features/admin/components/TablePagination';
import { FilterBar, PageHeader } from '@/features/admin/components/PageHeader';
import { AdminList, AdminListItem } from '@/features/admin/components/AdminList';
import { ProductDialog } from '@/features/admin/components/ProductDialog';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import { formatCurrency } from '@/features/admin/lib/format-currency';
import type { ProductAdmin, ProductCategoryAdmin } from '@/features/admin/types/admin';

/** Como o produto está pro site, em poucas palavras, na linha da lista. */
function stockLabel(product: ProductAdmin): string {
  if (product.stock === null) {
    return product.leadTimeDays ? `Sob encomenda · ${product.leadTimeDays} dias` : 'Sob encomenda · sem prazo';
  }
  return product.stock === 0 ? 'Esgotado' : `Estoque: ${product.stock}`;
}

export default function ProdutosPage() {
  const { apiFetch } = useApiClient();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [active, setActive] = useState('');
  const [featured, setFeatured] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const hasFilters = Boolean(debouncedSearch || categoryId || active || featured);
  const { data, items: products, isLoading, isRefreshing, error, refetch, pagination } =
    usePaginatedResource<ProductAdmin>('/products', {
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
      <FilterBar>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome"
          aria-label="Buscar produtos"
          className="w-56"
        />
        <NativeSelect
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
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
          value={active}
          onChange={(e) => setActive(e.target.value)}
          aria-label="Filtrar por situação"
          className="w-auto"
        >
          <option value="">No site e ocultos</option>
          <option value="true">Aparecem no site</option>
          <option value="false">Ocultos</option>
        </NativeSelect>
        <NativeSelect
          value={featured}
          onChange={(e) => setFeatured(e.target.value)}
          aria-label="Filtrar por destaque"
          className="w-auto"
        >
          <option value="">Com e sem destaque</option>
          <option value="true">Em destaque</option>
          <option value="false">Sem destaque</option>
        </NativeSelect>
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
                  className="size-12 flex-none rounded-lg border border-sand-line object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="size-12 flex-none rounded-lg border border-dashed border-sand-line bg-sand"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {product.name}
                  {product.featured && (
                    <span className="ml-2 rounded-full bg-moss/10 px-2 py-0.5 text-xs font-semibold text-moss">
                      Destaque
                    </span>
                  )}
                </p>
                <p className="text-sm text-ink-soft">
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
                Excluir
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
          title={`Excluir o produto "${deleting.name}"?`}
          isPending={mutation.isPending}
          error={mutation.error}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleting(null);
            mutation.clearError();
          }}
        >
          <p>O produto e as fotos dele saem do site. Pra só esconder, desligue a chave ao lado. Não dá pra desfazer.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
