'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { AdminList } from '@/features/admin/components/AdminList';
import { Badge } from '@/features/admin/components/Badge';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import { formatCurrency } from '@/lib/format';
import type { ProductAdmin, ProductCategoryAdmin } from '@/features/admin/types/admin';

/** Como o produto está pra venda, em poucas palavras, no card da lista. */
function stockLabel(product: ProductAdmin): string {
  if (product.stock === null) {
    return product.leadTimeDays ? `Sob encomenda · ${product.leadTimeDays} dias` : 'Sob encomenda · sem prazo';
  }
  return product.stock === 0 ? 'Esgotado' : `${product.stock} em estoque`;
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
        <Link href="/admin/produtos/novo" className={buttonVariants()}>
          Novo produto
        </Link>
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
            // No celular, um card: foto, dados e, embaixo, as ações. Do `sm`
            // pra cima, a mesma coisa vira uma linha só, como as outras listas.
            <li key={product.id} className="rounded-lg border border-border p-3 sm:flex sm:items-center sm:gap-3">
              <Link
                href={`/admin/produtos/${product.id}`}
                tabIndex={-1}
                className="flex min-w-0 flex-1 items-start gap-3 sm:items-center"
              >
                {product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- miniatura no admin, não precisa do otimizador
                  <img
                    src={product.images[0]}
                    alt=""
                    className="size-16 flex-none rounded-lg border border-border object-cover sm:size-12"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="size-16 flex-none rounded-lg border border-dashed border-border bg-muted sm:size-12"
                  />
                )}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.category.name}</p>
                  <p className="text-sm">
                    <span className="font-medium tabular-nums">{formatCurrency(product.price, 'BRL')}</span>
                    {product.listPrice != null && (
                      <s className="ml-1.5 text-muted-foreground tabular-nums">
                        {formatCurrency(product.listPrice, 'BRL')}
                      </s>
                    )}
                    <span className="text-muted-foreground"> · {stockLabel(product)}</span>
                  </p>
                  {(product.featured || product.listPrice != null || product.images.length === 0) && (
                    <p className="flex flex-wrap gap-1.5 pt-1">
                      {product.featured && <Badge size="sm">Destaque</Badge>}
                      {product.listPrice != null && <Badge size="sm">Em promoção</Badge>}
                      {product.images.length === 0 && <Badge size="sm">Sem foto</Badge>}
                    </p>
                  )}
                </div>
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 sm:mt-0 sm:flex-nowrap sm:border-0 sm:pt-0">
                <label className="mr-auto flex items-center gap-2 text-sm text-muted-foreground sm:mr-1">
                  <Switch
                    checked={product.active}
                    onCheckedChange={() => toggleActive(product)}
                    disabled={busy}
                    aria-label={`Mostrar ${product.name} no site`}
                  />
                  <span aria-hidden="true">{product.active ? 'No site' : 'Oculto'}</span>
                </label>
                <Link
                  href={`/admin/produtos/${product.id}`}
                  aria-label={`Editar ${product.name}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Editar
                </Link>
                <Link
                  href={`/admin/produtos/novo?duplicar=${encodeURIComponent(product.id)}`}
                  aria-label={`Duplicar ${product.name}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Duplicar
                </Link>
                <Button variant="destructive" size="sm" disabled={busy} onClick={() => setDeleting(product)}>
                  Remover
                </Button>
              </div>
            </li>
          ))}
        </AdminList>
      )}
      {pagination && <TablePagination {...pagination} itemLabel="produtos" />}
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
            Remove o produto e as fotos pra sempre, sem desfazer. Quer só tirar do site? Desligue a chave "No site" no
            card.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
