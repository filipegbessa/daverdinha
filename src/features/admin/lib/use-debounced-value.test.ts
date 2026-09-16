import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from './use-debounced-value';

describe('useDebouncedValue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns the initial value straight away', () => {
    const { result } = renderHook(() => useDebouncedValue('maria'));
    expect(result.current).toBe('maria');
  });

  it('holds a change back until the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'm' },
    });

    rerender({ value: 'ma' });
    expect(result.current).toBe('m');

    act(() => jest.advanceTimersByTime(300));
    expect(result.current).toBe('ma');
  });

  it('only emits the last value of a burst, not one per keystroke', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: '' },
    });

    for (const value of ['m', 'ma', 'mar', 'mari', 'maria']) {
      rerender({ value });
      act(() => jest.advanceTimersByTime(100));
    }

    expect(result.current).toBe('');

    act(() => jest.advanceTimersByTime(300));
    expect(result.current).toBe('maria');
  });
});
