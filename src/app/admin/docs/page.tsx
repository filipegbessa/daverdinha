'use client';
import dynamic from 'next/dynamic';
import { useApiResource } from '@/features/admin/lib/use-api-resource';
import { ErrorAlert, LoadingState } from '@/features/admin/components/StatusMessage';

// Scalar mounts a Vue app straight into the DOM, so there's nothing to
// prerender — and loading it lazily keeps its weight off every other admin
// screen.
const ApiDocsViewer = dynamic(
  () => import('@/features/admin/components/ApiDocsViewer').then((m) => m.ApiDocsViewer),
  { ssr: false, loading: () => <LoadingState /> },
);

/**
 * The API's OpenAPI document, browsable and testable. It sits under /admin so
 * the Clerk login already guards it, and the spec itself comes from
 * `GET /openapi.json`, which the API guards the same way.
 */
export default function DocsPage() {
  const { data: spec, isLoading, error } = useApiResource<object>('/openapi.json');

  return (
    <div>
      <h1 className="text-2xl font-semibold">Documentação da API</h1>
      <p className="mt-1 text-sm text-ink-soft">
        As chamadas feitas pelo &quot;Test Request&quot; usam a sua sessão e batem na API de verdade.
      </p>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      {isLoading && <LoadingState />}
      {spec && (
        <div className="mt-6">
          <ApiDocsViewer spec={spec} />
        </div>
      )}
    </div>
  );
}
