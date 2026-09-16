'use client';
import { useCallback, useState } from 'react';

interface UseApiMutationResult {
  /**
   * Runs `action`, holding `isPending` for its whole duration and capturing
   * anything it throws into `error`. Resolves to true on success, so a
   * caller can branch (close the dialog, reset the form) without a try/catch
   * of its own.
   */
  run: (action: () => Promise<unknown>) => Promise<boolean>;
  isPending: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * The write half of `useApiResource`. Every admin screen had hand-rolled the
 * same `setError(null) / setBusy(true) / try / catch / finally` ladder around
 * each POST, PATCH and DELETE — a dozen copies, each one an opportunity to
 * forget the `finally` and leave a button disabled forever.
 */
export function useApiMutation(fallbackMessage = 'Não foi possível concluir a ação.'): UseApiMutationResult {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setError(null);
      setIsPending(true);
      try {
        await action();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : fallbackMessage);
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [fallbackMessage],
  );

  return { run, isPending, error, clearError };
}
