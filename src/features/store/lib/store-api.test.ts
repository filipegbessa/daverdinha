import { quoteCart } from './store-api';

/** Resposta mínima de `fetch`: o jsdom dos testes não tem `Response`. */
function reply(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('quoteCart', () => {
  const originalUrl = process.env.NEXT_PUBLIC_API_URL;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.test';
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalUrl;
  });

  it('posts only product ids and quantities, and the CEP when there is one', async () => {
    const quote = { items: [], subtotal: 0 };
    fetchMock.mockResolvedValue(reply(200, quote));

    await expect(quoteCart([{ productId: 'p1', quantity: 2 }], '22220-000')).resolves.toEqual(quote);
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/checkout/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ productId: 'p1', quantity: 2 }], cep: '22220-000' }),
    });
  });

  it('never throws: an error response or a network failure is null', async () => {
    fetchMock.mockResolvedValueOnce(reply(400, {}));
    await expect(quoteCart([{ productId: 'p1', quantity: 1 }])).resolves.toBeNull();

    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(quoteCart([{ productId: 'p1', quantity: 1 }])).resolves.toBeNull();
  });

  it('does not call the API for an empty cart', async () => {
    await expect(quoteCart([])).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
