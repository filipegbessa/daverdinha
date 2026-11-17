'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { PageHeader } from '@/features/admin/components/PageHeader';
import { BackLink } from '@/features/admin/components/BackLink';
import { ProductForm } from '@/features/admin/components/ProductForm';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';
import type { ProductAdmin, ProductCategoryAdmin } from '@/features/admin/types/admin';

/**
 * Novo produto. Com `?duplicar=<id>`, começa com os dados daquele produto
 * (nome com "(cópia)"), oculto do site e sem fotos: a API não copia fotos de
 * um produto pro outro, então elas são escolhidas de novo.
 */
function NovoProduto() {
  const router = useRouter();
  const sourceId = useSearchParams().get('duplicar');
  const { data: categories, error: categoriesError } = useApiResource<ProductCategoryAdmin[]>('/product-categories');
  const { data: source, error: sourceError } = useApiResource<ProductAdmin>(
    sourceId ? `/products/${encodeURIComponent(sourceId)}` : null,
  );
  const title = sourceId ? 'Duplicar produto' : 'Novo produto';

  const header = (
    <>
      <BackLink href="/admin/produtos">Voltar para produtos</BackLink>
      <PageHeader title={title} />
    </>
  );

  if (categoriesError || sourceError) {
    return (
      <div>
        {header}
        <ErrorAlert>{categoriesError ?? sourceError}</ErrorAlert>
      </div>
    );
  }
  if (!categories || (sourceId && !source)) {
    return (
      <div>
        {header}
        <LoadingState />
      </div>
    );
  }
  if (categories.length === 0) {
    return (
      <div>
        {header}
        <p className="mt-6">Cadastre uma categoria primeiro: todo produto fica dentro de uma.</p>
        <Link href="/admin/categorias" className={`${buttonVariants()} mt-4`}>
          Ir para categorias
        </Link>
      </div>
    );
  }

  return (
    <div>
      {header}
      {source && (
        <p className="mt-2 text-sm text-muted-foreground">
          Cópia de “{source.name}”, oculta do site até você ligar. Escolha as fotos de novo: elas não são copiadas.
        </p>
      )}
      <div className="mt-6">
        <ProductForm
          product={null}
          initial={source ? { ...source, name: `${source.name} (cópia)`, active: false, featured: false } : undefined}
          categories={categories}
          onSaved={(created) => router.push(`/admin/produtos/${created.id}?criado=1`)}
        />
      </div>
    </div>
  );
}

export default function NovoProdutoPage() {
  // `useSearchParams` precisa de um Suspense em volta pra página poder ser gerada no build.
  return (
    <Suspense fallback={<LoadingState />}>
      <NovoProduto />
    </Suspense>
  );
}
