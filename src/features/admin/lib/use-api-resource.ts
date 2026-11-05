'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApiClient } from '@/features/admin/lib/api-client';

interface UseApiResourceOptions {
  pollIntervalMs?: number;
}

interface UseApiResourceResult<T> {
  data: T | null;
  isLoading: boolean;
  /**
   * A request the operator caused is in flight while older `data` is still
   * on screen: another page, new filters, or `refetch()` after a save. Lists
   * dim themselves with it (`BusyRegion`) so they don't look settled while
   * they're about to change. Background polls never set it.
   */
  isRefreshing: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches a single resource via the authenticated API client, tracking honest
 * loading/error state. Pass `null` for `path` to skip fetching (e.g. while a
 * route param hasn't resolved yet). Pass `pollIntervalMs` to re-fetch on an
 * interval (a background poll never flips `isLoading` back to true once data
 * has already loaded once — only the first load and an explicit `refetch()`
 * do). `refetch()` triggers an immediate fetch outside the poll interval.
 */
export function useApiResource<T>(
  path: string | null,
  options?: UseApiResourceOptions,
): UseApiResourceResult<T> {
  const { apiFetch } = useApiClient();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(path !== null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);
  // Set by the poll right before it bumps the index, so that one fetch stays
  // invisible; anything else that re-runs the effect is shown.
  const silentRef = useRef(false);
  const pollIntervalMs = options?.pollIntervalMs;

  const refetch = useCallback(() => {
    setRefetchIndex((index) => index + 1);
  }, []);

  const pollRefetch = useCallback(() => {
    silentRef.current = true;
    setRefetchIndex((index) => index + 1);
  }, []);

  useEffect(() => {
    if (path === null) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const silent = silentRef.current;
    silentRef.current = false;

    // Only show the loading state before the first successful load — a
    // background poll or a manual refetch shouldn't flash "Carregando...".
    if (data === null) {
      setIsLoading(true);
    } else if (!silent) {
      setIsRefreshing(true);
    }
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
        setIsRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `data` is read
    // intentionally without being a dependency: it's checked to decide
    // whether to show the loading spinner, not to control when this effect
    // re-runs (that would create a fetch loop).
  }, [apiFetch, path, refetchIndex]);

  useEffect(() => {
    if (path === null || !pollIntervalMs) return;

    const interval = setInterval(pollRefetch, pollIntervalMs);
    return () => clearInterval(interval);
  }, [path, pollIntervalMs, pollRefetch]);

  return { data, isLoading, isRefreshing, error, refetch };
}
