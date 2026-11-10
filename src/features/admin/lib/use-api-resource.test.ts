import { act, renderHook, waitFor } from '@testing-library/react';
import { useApiResource } from './use-api-resource';
import { useApiClient } from './api-client';

jest.mock('./api-client');

describe('useApiResource', () => {
  it('starts in a loading state and resolves with the fetched data', async () => {
    let resolveFetch: (value: { id: string }) => void = () => {};
    const apiFetch = jest.fn().mockReturnValue(
      new Promise<{ id: string }>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    const { result } = renderHook(() => useApiResource<{ id: string }>('/conversations'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    resolveFetch({ id: 'c1' });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual({ id: 'c1' });
    expect(result.current.error).toBeNull();
    expect(apiFetch).toHaveBeenCalledWith('/conversations');
  });

  it('surfaces an error message when the request rejects', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Erro 500'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    const { result } = renderHook(() => useApiResource('/conversations'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Erro 500');
    expect(result.current.data).toBeNull();
  });

  it('falls back to a generic error message for non-Error rejections', async () => {
    const apiFetch = jest.fn().mockRejectedValue('boom');
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    const { result } = renderHook(() => useApiResource('/conversations'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Erro ao carregar dados.');
  });

  it('does not fetch when path is null', () => {
    const apiFetch = jest.fn();
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    const { result } = renderHook(() => useApiResource(null));

    expect(apiFetch).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('re-fetches when the path changes', async () => {
    const apiFetch = jest.fn().mockResolvedValueOnce({ id: 'c1' }).mockResolvedValueOnce({ id: 'c2' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    const { result, rerender } = renderHook(({ path }) => useApiResource<{ id: string }>(path), {
      initialProps: { path: '/conversations/c1' },
    });

    await waitFor(() => expect(result.current.data).toEqual({ id: 'c1' }));

    rerender({ path: '/conversations/c2' });

    await waitFor(() => expect(result.current.data).toEqual({ id: 'c2' }));
    expect(apiFetch).toHaveBeenCalledTimes(2);
    expect(apiFetch).toHaveBeenNthCalledWith(1, '/conversations/c1');
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/conversations/c2');
  });

  it('does not update state after unmount, avoiding a setState-on-unmounted-component warning', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    let resolveFetch: (value: { id: string }) => void = () => {};
    const apiFetch = jest.fn().mockReturnValue(
      new Promise<{ id: string }>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    const { unmount } = renderHook(() => useApiResource<{ id: string }>('/conversations'));

    unmount();
    resolveFetch({ id: 'c1' });

    await Promise.resolve();
    await Promise.resolve();

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('does not double-fetch on re-render with the same path', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ id: 'c1' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    const { result, rerender } = renderHook(() => useApiResource<{ id: string }>('/conversations'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender();

    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('polls at the given interval when pollIntervalMs is provided', async () => {
    jest.useFakeTimers();
    const apiFetch = jest.fn().mockResolvedValue({ id: 'c1' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    renderHook(() => useApiResource<{ id: string }>('/conversations/c1', { pollIntervalMs: 5000 }));

    // Flush the initial fetch's promise resolution inside `act` before
    // advancing fake timers — otherwise the resulting state update lands
    // outside any `act` call and React warns, even though the assertions
    // below already wait for the right thing.
    await act(async () => {});
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));

    await act(async () => {
      await jest.advanceTimersByTimeAsync(5000);
    });
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));

    await act(async () => {
      await jest.advanceTimersByTimeAsync(5000);
    });
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(3));

    jest.useRealTimers();
  });

  it('does not poll when pollIntervalMs is not provided', async () => {
    jest.useFakeTimers();
    const apiFetch = jest.fn().mockResolvedValue({ id: 'c1' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    renderHook(() => useApiResource<{ id: string }>('/conversations/c1'));

    await act(async () => {});
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));

    jest.advanceTimersByTime(60000);

    expect(apiFetch).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('refetch() triggers an immediate fetch outside the poll interval', async () => {
    const apiFetch = jest.fn().mockResolvedValueOnce({ id: 'c1' }).mockResolvedValueOnce({ id: 'c1-updated' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    const { result } = renderHook(() => useApiResource<{ id: string }>('/conversations/c1'));

    await waitFor(() => expect(result.current.data).toEqual({ id: 'c1' }));

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.data).toEqual({ id: 'c1-updated' }));
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });

  it('refetch() resolves only once the new data is in', async () => {
    let resolveSecond!: (value: { n: number }) => void;
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce({ n: 1 })
      .mockReturnValueOnce(new Promise((resolve) => (resolveSecond = resolve)));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    const { result } = renderHook(() => useApiResource<{ n: number }>('/conversations'));
    await waitFor(() => expect(result.current.data).toEqual({ n: 1 }));

    let settled = false;
    let reload!: Promise<void>;
    act(() => {
      reload = result.current.refetch().then(() => {
        settled = true;
      });
    });
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
    expect(settled).toBe(false);

    await act(async () => {
      resolveSecond({ n: 2 });
      await reload;
    });
    expect(settled).toBe(true);
    expect(result.current.data).toEqual({ n: 2 });
  });

  it('does not flip isLoading back to true on a background poll refetch once data has already loaded', async () => {
    jest.useFakeTimers();
    const apiFetch = jest.fn().mockResolvedValue({ id: 'c1' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    const { result } = renderHook(() => useApiResource<{ id: string }>('/conversations/c1', { pollIntervalMs: 5000 }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await jest.advanceTimersByTimeAsync(5000);
    });
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));

    expect(result.current.isLoading).toBe(false);
    jest.useRealTimers();
  });

  it('flags isRefreshing while a new path loads over data already on screen, without going back to isLoading', async () => {
    let resolveSecond: (value: string) => void = () => {};
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce('page 1')
      .mockReturnValueOnce(new Promise<string>((resolve) => (resolveSecond = resolve)));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    const { result, rerender } = renderHook(({ path }) => useApiResource<string>(path), {
      initialProps: { path: '/categories' },
    });
    await waitFor(() => expect(result.current.data).toBe('page 1'));
    expect(result.current.isRefreshing).toBe(false);

    rerender({ path: '/categories?page=2' });

    await waitFor(() => expect(result.current.isRefreshing).toBe(true));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe('page 1');

    resolveSecond('page 2');
    await waitFor(() => expect(result.current.isRefreshing).toBe(false));
    expect(result.current.data).toBe('page 2');
  });

  it('keeps background polls silent', async () => {
    jest.useFakeTimers();
    try {
      const apiFetch = jest.fn().mockResolvedValue('ok');
      (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

      const { result } = renderHook(() => useApiResource<string>('/conversations', { pollIntervalMs: 1000 }));
      await waitFor(() => expect(result.current.data).toBe('ok'));

      apiFetch.mockReturnValue(new Promise(() => {}));
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(apiFetch).toHaveBeenCalledTimes(2);
      expect(result.current.isRefreshing).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });
});
