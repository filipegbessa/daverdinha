import { useApiClient } from '@/features/admin/lib/api-client';
import type { Paginated } from '@/features/admin/types/admin';

type Routes = (path: string, init?: RequestInit) => unknown;

/**
 * Troca o `apiFetch` do admin por um mock que responde por rota: `routes`
 * recebe o caminho e o `init` e devolve a resposta (ou uma promessa, pra
 * simular erro ou demora). Devolve o mock, pra conferir as chamadas.
 *
 * O teste precisa ter `jest.mock('@/features/admin/lib/api-client')`; o mock
 * do módulo é içado pelo Jest e só vale se estiver no próprio arquivo.
 */
export function mockApi(routes: Routes = () => undefined) {
  const apiFetch = jest.fn(async (path: string, init?: RequestInit) => routes(path, init));
  (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
  return apiFetch;
}

/** Uma página só com `items`, no formato das listas paginadas da API. */
export function paginated<T>(items: T[], overrides: Partial<Paginated<T>> = {}): Paginated<T> {
  return { items, page: 1, perPage: 20, total: items.length, totalPages: 1, ...overrides };
}
