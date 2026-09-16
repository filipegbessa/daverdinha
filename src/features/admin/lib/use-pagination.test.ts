import { act, renderHook } from '@testing-library/react';
import { usePagination } from './use-pagination';

describe('usePagination', () => {
  it('starts on the first page', () => {
    const { result } = renderHook(() => usePagination('', 5));
    expect(result.current.page).toBe(1);
  });

  it('moves to the page it is told to', () => {
    const { result } = renderHook(() => usePagination('', 5));

    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);
  });

  it('goes back to page 1 when the filters change', () => {
    const { result, rerender } = renderHook(({ key }) => usePagination(key, 5), {
      initialProps: { key: 'a' },
    });

    act(() => result.current.setPage(4));
    expect(result.current.page).toBe(4);

    rerender({ key: 'b' });
    expect(result.current.page).toBe(1);
  });

  it('falls back to the last page when the current one stops existing', () => {
    const { result, rerender } = renderHook(({ totalPages }) => usePagination('', totalPages), {
      initialProps: { totalPages: 7 },
    });

    act(() => result.current.setPage(7));
    rerender({ totalPages: 3 });

    expect(result.current.page).toBe(3);
  });

  it('leaves the page alone while the total is still unknown', () => {
    const { result } = renderHook(() => usePagination('', undefined));

    act(() => result.current.setPage(4));
    expect(result.current.page).toBe(4);
  });
});
