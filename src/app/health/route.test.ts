/**
 * @jest-environment node
 */
import { GET } from './route';

describe('GET /health', () => {
  it('answers 200 without touching the API, and is never cached', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    const response = GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
