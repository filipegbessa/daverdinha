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
import { ProductForm } from '@/features/admin/components/ProductForm';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import type { ProductAdmin, ProductCategoryAdmin } from '@/features/admin/types/admin';

/**
 * Editar um produto, em página própria. No topo: ver no site, duplicar e
 * excluir (o mesmo "remover pra sempre" da lista, com confirmação).
 */
function ProdutoEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const justCreated = useSearchParams().get('criado') === '1';
  const { apiFetch } = useApiClient();
  const { data: product, isLoading, error } = useApiResource<ProductAdmin>(`/products/${encodeURIComponent(id)}`);
  const { data: categories, error: categoriesError } = useApiResource<ProductCategoryAdmin[]>('/product-categories');
  const remove = useApiMutation('Erro ao remover o produto.');
  const [deleting, setDeleting] = useState(false);
  const [current, setCurrent] = useState<ProductAdmin | null>(null);
  const shown = current ?? product;

  const back = <BackLink href="/admin/produtos">Voltar para produtos</BackLink>;

  if (!shown || !categories) {
    return (
      <div>
        {back}
        <PageHeader title="Produto" />
        {isLoading || (!error && !categoriesError) ? (
          <LoadingState />
        ) : (
          <ErrorAlert>{error ?? categoriesError ?? 'Produto não encontrado.'}</ErrorAlert>
        )}
      </div>
    );
  }

  async function handleConfirmDelete() {
    const ok = await remove.run(() => apiFetch(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' }));
    if (ok) router.push('/admin/produtos');
  }

  const siteHref = `/produtos/${shown.category.slug}/${shown.slug}`;

  return (
    <div>
      {back}
      <PageHeader title={shown.name}>
        <div className="flex flex-wrap gap-2">
          {shown.active && (
            <a href={siteHref} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}>
              <ExternalLink aria-hidden="true" />
              Ver no site
            </a>
          )}
          <Link
            href={`/admin/produtos/novo?duplicar=${encodeURIComponent(shown.id)}`}
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
        <ProductForm
          // Recria o formulário quando outro produto é aberto na mesma página.
          key={shown.id}
          product={shown}
          categories={categories}
          notice={justCreated ? 'Produto criado.' : null}
          onSaved={setCurrent}
        />
      </div>
      {deleting && (
        <ConfirmDialog
          title={`Remover o produto "${shown.name}"?`}
          confirmLabel="Remover produto"
          pendingLabel="Removendo..."
          isPending={remove.isPending}
          error={remove.error}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleting(false);
            remove.clearError();
          }}
        >
          <p>
            Remove o produto e as fotos pra sempre, sem desfazer. Quer só tirar do site? Desligue &quot;Aparece no
            site&quot;.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}

export default function ProdutoPage() {
  // `useSearchParams` ("Produto criado.") pede um Suspense em volta.
  return (
    <Suspense fallback={<LoadingState />}>
      <ProdutoEditor />
    </Suspense>
  );
}
