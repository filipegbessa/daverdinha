'use client';
import { useEffect, useState } from 'react';
import { useApiClient } from '@/features/admin/lib/api-client';

interface UseApiResourceResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches a single resource via the authenticated API client, tracking honest
 * loading/error state. Pass `null` for `path` to skip fetching (e.g. while a
 * route param hasn't resolved yet).
 */
export function useApiResource<T>(path: string | null): UseApiResourceResult<T> {
  const { apiFetch } = useApiClient();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(path !== null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (path === null) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    setIsLoading(true);
    setError(null);

    apiFetch<T>(path)
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiFetch, path]);

  return { data, isLoading, error };
}
