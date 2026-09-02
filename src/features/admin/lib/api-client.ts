'use client';
import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';

export function useApiClient() {
  const { getToken } = useAuth();

  const apiFetch = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
      const token = await getToken();
      const isFormData = options.body instanceof FormData;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
        ...options,
        headers: {
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? `Erro ${response.status}`);
      }

      if (response.status === 204) return undefined as T;
      return response.json();
    },
    [getToken],
  );

  return { apiFetch };
}
