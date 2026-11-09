import { createCheckout, getOrderByToken, quoteCart } from './store-api';

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

describe('createCheckout', () => {
  const originalUrl = process.env.NEXT_PUBLIC_API_URL;
  let fetchMock: jest.Mock;
  const input = {
    items: [{ productId: 'p1', quantity: 1 }],
    customer: { name: 'Maria', email: 'maria@exemplo.com', phone: '21999998888' },
    deliveryMethod: 'pickup' as const,
  };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.test';
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalUrl;
  });

  it('returns the order code, token and payment URL', async () => {
    fetchMock.mockResolvedValue(reply(201, { code: 'DV-0001', token: 't', paymentUrl: 'https://pay' }));

    await expect(createCheckout(input)).resolves.toEqual({
      ok: true,
      code: 'DV-0001',
      token: 't',
      paymentUrl: 'https://pay',
    });
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/checkout', expect.objectContaining({ method: 'POST' }));
  });

  it('passes on the problems of a 409 and the reason of a 422', async () => {
    const problems = [{ productId: 'p1', reason: 'insufficient_stock', available: 0 }];
    fetchMock.mockResolvedValueOnce(reply(409, { message: 'Estoque mudou.', problems }));
    await expect(createCheckout(input)).resolves.toEqual({
      ok: false,
      status: 409,
      message: 'Estoque mudou.',
      problems,
    });

    fetchMock.mockResolvedValueOnce(reply(422, { message: 'Sem entrega.', reason: 'no_area' }));
    await expect(createCheckout(input)).resolves.toEqual({
      ok: false,
      status: 422,
      message: 'Sem entrega.',
      reason: 'no_area',
    });
  });

  it('turns other errors and network failures into a retry message', async () => {
    fetchMock.mockResolvedValueOnce(reply(503, { message: 'gateway' }));
    await expect(createCheckout(input)).resolves.toEqual(
      expect.objectContaining({ ok: false, status: 503, message: expect.stringMatching(/Tente de novo/) }),
    );

    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(createCheckout(input)).resolves.toEqual(expect.objectContaining({ ok: false, status: 0 }));
  });
});

describe('getOrderByToken', () => {
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

  it('reads the order without cache', async () => {
    fetchMock.mockResolvedValue(reply(200, { code: 'DV-0001' }));

    await expect(getOrderByToken('a b')).resolves.toEqual({ code: 'DV-0001' });
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/checkout/orders/a%20b', { cache: 'no-store' });
  });

  it('is null on a 404 or a failure', async () => {
    fetchMock.mockResolvedValueOnce(reply(404, {}));
    await expect(getOrderByToken('x')).resolves.toBeNull();
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(getOrderByToken('x')).resolves.toBeNull();
  });
});
