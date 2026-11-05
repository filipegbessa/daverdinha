'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useApiClient } from '@/features/admin/lib/api-client';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { useApiMutation } from '@/features/admin/lib/use-api-mutation';
import { usePagination } from '@/features/admin/lib/use-pagination';
import { TablePagination } from '@/features/admin/components/TablePagination';
import { ProductDialog } from '@/features/admin/components/ProductDialog';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import { formatCurrency } from '@/features/admin/lib/format-currency';
import type { Paginated, ProductAdmin, ProductCategoryAdmin } from '@/features/admin/types/admin';

export default function ProdutosPage() {
  const { apiFetch } = useApiClient();
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
  const { page, setPage } = usePagination('', totalPages);
  const { data, isLoading, error, refetch } = useApiResource<Paginated<ProductAdmin>>(
    `/products${page > 1 ? `?page=${page}` : ''}`,
  );
  const { data: categories } = useApiResource<ProductCategoryAdmin[]>('/product-categories');
  const products = data?.items;

  useEffect(() => {
    if (data) setTotalPages(data.totalPages);
  }, [data]);

  const mutation = useApiMutation('Erro ao atualizar produto.');
  const [editing, setEditing] = useState<ProductAdmin | 'new' | null>(null);
  const [deleting, setDeleting] = useState<ProductAdmin | null>(null);
  const busy = mutation.isPending;

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Produtos</h1>
        <Button onClick={() => setEditing('new')} disabled={!categories}>
          Novo produto
        </Button>
      </div>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      {mutation.error && !deleting && <ErrorAlert>{mutation.error}</ErrorAlert>}
      {isLoading && <LoadingState />}
      {products && products.length === 0 && (
        <p className="mt-6 text-ink-soft">Nenhum produto ainda. Os produtos cadastrados aqui aparecem no site.</p>
      )}
      {products && products.length > 0 && (
        <ul className={`mt-6 space-y-2 ${busy ? 'cursor-wait opacity-50' : ''}`} aria-busy={busy}>
          {products.map((product) => (
            <li
              key={product.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-sand-line p-3"
            >
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
            </li>
          ))}
        </ul>
      )}
      {data && (
        <TablePagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          itemLabel="produtos"
          onPageChange={setPage}
        />
      )}
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
