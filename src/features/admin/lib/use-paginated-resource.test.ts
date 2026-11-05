import { act, renderHook, waitFor } from '@testing-library/react';
import { usePaginatedResource } from './use-paginated-resource';
import { useApiClient } from './api-client';

jest.mock('./api-client');

const envelope = (page: number, totalPages = 3) => ({ items: [`item-${page}`], page, perPage: 20, total: 50, totalPages });

describe('usePaginatedResource', () => {
  it('builds the query from the filters, skipping empty ones, and pages through', async () => {
    const apiFetch = jest.fn((path: string) => Promise.resolve(envelope(path.includes('page=2') ? 2 : 1)));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    const { result } = renderHook(() => usePaginatedResource<string>('/products', { q: 'vaso', category: undefined }));

    await waitFor(() => expect(result.current.items).toEqual(['item-1']));
    expect(apiFetch).toHaveBeenLastCalledWith('/products?q=vaso');
    expect(result.current.pagination).toMatchObject({ page: 1, totalPages: 3, total: 50, isBusy: false });

    act(() => result.current.pagination!.onPageChange(2));

    await waitFor(() => expect(result.current.items).toEqual(['item-2']));
    expect(apiFetch).toHaveBeenLastCalledWith('/products?q=vaso&page=2');
  });

  it('goes back to page 1 when a filter changes', async () => {
    const apiFetch = jest.fn((path: string) => Promise.resolve(envelope(path.includes('page=2') ? 2 : 1)));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    const { result, rerender } = renderHook(({ q }) => usePaginatedResource<string>('/products', { q }), {
      initialProps: { q: 'vaso' },
    });
    await waitFor(() => expect(result.current.pagination).not.toBeNull());
    act(() => result.current.pagination!.onPageChange(2));
    await waitFor(() => expect(result.current.items).toEqual(['item-2']));

    rerender({ q: 'kit' });

    await waitFor(() => expect(apiFetch).toHaveBeenLastCalledWith('/products?q=kit'));
  });
});
