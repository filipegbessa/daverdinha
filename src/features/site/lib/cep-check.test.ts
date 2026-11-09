import { checkCep } from './cep-check';

function apiReturns(body: object, ok = true) {
  (global.fetch as jest.Mock).mockResolvedValue({ ok, json: async () => body });
}

describe('checkCep', () => {
  const originalUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.test';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalUrl;
  });

  it('asks the API, which answers like the bot does', async () => {
    apiReturns({ status: 'covered', bairro: 'Saúde' });

    await expect(checkCep('20220-030')).resolves.toEqual({ status: 'covered', bairro: 'Saúde' });
    expect(global.fetch).toHaveBeenCalledWith('https://api.test/delivery-locations/check?cep=20220030');
  });

  it('passes on a bairro that is not covered, including another city', async () => {
    apiReturns({ status: 'not_covered', bairro: 'Centro (Niterói)' });

    await expect(checkCep('24020000')).resolves.toEqual({ status: 'not_covered', bairro: 'Centro (Niterói)' });
  });

  it('does not call the API for a CEP that is not 8 digits', async () => {
    await expect(checkCep('2022')).resolves.toEqual({ status: 'unresolved' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('gives up cleanly when the CEP is unknown, the API fails or it has no URL', async () => {
    apiReturns({ status: 'unresolved' });
    await expect(checkCep('99999999')).resolves.toEqual({ status: 'unresolved' });

    apiReturns({}, false);
    await expect(checkCep('99999999')).resolves.toEqual({ status: 'unresolved' });

    (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));
    await expect(checkCep('20220030')).resolves.toEqual({ status: 'unresolved' });

    delete process.env.NEXT_PUBLIC_API_URL;
    await expect(checkCep('20220030')).resolves.toEqual({ status: 'unresolved' });
  });
});
