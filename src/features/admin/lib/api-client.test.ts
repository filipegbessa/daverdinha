import { renderHook, waitFor } from '@testing-library/react';
import { useApiClient } from './api-client';
import { useAuth } from '@clerk/nextjs';

jest.mock('@clerk/nextjs', () => ({ useAuth: jest.fn() }));

describe('useApiClient', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
    (useAuth as jest.Mock).mockReturnValue({ getToken: jest.fn().mockResolvedValue('test-token') });
  });

  it('attaches the Clerk bearer token and calls the right URL', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) }) as any;
    const { result } = renderHook(() => useApiClient());

    const data = await result.current.apiFetch('/bot-settings');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/bot-settings',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) }),
    );
    expect(data).toEqual({ ok: true });
  });

  it('throws with the backend error message when the response is not ok', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 400, json: async () => ({ message: 'Dados inválidos' }) }) as any;
    const { result } = renderHook(() => useApiClient());

    await expect(result.current.apiFetch('/menu-items', { method: 'POST' })).rejects.toThrow('Dados inválidos');
  });

  it('returns undefined for 204 No Content responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 204 }) as any;
    const { result } = renderHook(() => useApiClient());
    const data = await result.current.apiFetch('/menu-items/1', { method: 'DELETE' });
    expect(data).toBeUndefined();
  });

  it('does not force a JSON Content-Type when the body is FormData, so the browser sets the multipart boundary itself', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ url: 'https://blob/x.jpg' }) }) as any;
    const { result } = renderHook(() => useApiClient());

    const form = new FormData();
    form.append('file', new Blob(['x']), 'x.jpg');
    await result.current.apiFetch('/hero-slides/upload-image', { method: 'POST', body: form });

    const [, options] = (fetch as jest.Mock).mock.calls[0];
    expect(options.headers['Content-Type']).toBeUndefined();
    expect(options.body).toBe(form);
  });
});
