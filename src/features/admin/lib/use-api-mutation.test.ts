import { act, renderHook, waitFor } from '@testing-library/react';
import { useApiMutation } from './use-api-mutation';

describe('useApiMutation', () => {
  it('starts idle with no error', () => {
    const { result } = renderHook(() => useApiMutation());
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('holds isPending for the whole action and resolves true on success', async () => {
    const { result } = renderHook(() => useApiMutation());
    let release!: () => void;
    const action = () => new Promise<void>((resolve) => (release = resolve));

    let outcome: Promise<boolean>;
    act(() => {
      outcome = result.current.run(action);
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    await act(async () => {
      release();
      await outcome;
    });

    expect(result.current.isPending).toBe(false);
    await expect(outcome!).resolves.toBe(true);
  });

  it("captures the thrown error's message and resolves false", async () => {
    const { result } = renderHook(() => useApiMutation());

    let outcome!: boolean;
    await act(async () => {
      outcome = await result.current.run(() => Promise.reject(new Error('Já existe uma categoria com esse nome.')));
    });

    expect(outcome).toBe(false);
    expect(result.current.error).toBe('Já existe uma categoria com esse nome.');
    expect(result.current.isPending).toBe(false);
  });

  it('falls back to the configured message when what was thrown is not an Error', async () => {
    const { result } = renderHook(() => useApiMutation('Erro ao excluir categoria.'));

    await act(async () => {
      await result.current.run(() => Promise.reject('boom'));
    });

    expect(result.current.error).toBe('Erro ao excluir categoria.');
  });

  it('clears a previous error when a later run succeeds', async () => {
    const { result } = renderHook(() => useApiMutation());

    await act(async () => {
      await result.current.run(() => Promise.reject(new Error('falhou')));
    });
    expect(result.current.error).toBe('falhou');

    await act(async () => {
      await result.current.run(() => Promise.resolve());
    });
    expect(result.current.error).toBeNull();
  });

  it('clears the error on demand, so a dismissed dialog does not reopen showing it', async () => {
    const { result } = renderHook(() => useApiMutation());

    await act(async () => {
      await result.current.run(() => Promise.reject(new Error('falhou')));
    });

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it('leaves isPending false when the action throws synchronously', async () => {
    const { result } = renderHook(() => useApiMutation());

    await act(async () => {
      await result.current.run(() => {
        throw new Error('estourou antes do await');
      });
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe('estourou antes do await');
  });
});
