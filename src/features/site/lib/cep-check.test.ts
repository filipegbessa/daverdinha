import { checkCep, normalizeBairro } from './cep-check';

const zones = [{ zone: 'Centro', bairros: ['Santo Cristo', 'Saúde'] }];

function brasilApiReturns(body: object, ok = true) {
  (global.fetch as jest.Mock).mockResolvedValue({ ok, json: async () => body });
}

describe('checkCep', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => jest.restoreAllMocks());

  it('ignores accents and case when matching the bairro', () => {
    expect(normalizeBairro('  Saúde ')).toBe('saude');
  });

  it('says yes when the CEP falls in a covered bairro', async () => {
    brasilApiReturns({ neighborhood: 'Saude', city: 'Rio de Janeiro' });

    await expect(checkCep('20220-030', zones)).resolves.toEqual({ status: 'covered', bairro: 'Saude' });
    expect(global.fetch).toHaveBeenCalledWith('https://brasilapi.com.br/api/cep/v2/20220030');
  });

  it('says no for a bairro outside the list', async () => {
    brasilApiReturns({ neighborhood: 'Barra da Tijuca', city: 'Rio de Janeiro' });

    await expect(checkCep('22640100', zones)).resolves.toEqual({ status: 'not_covered', bairro: 'Barra da Tijuca' });
  });

  it('says no for another city, even with a bairro of the same name', async () => {
    brasilApiReturns({ neighborhood: 'Centro', city: 'Niterói' });

    await expect(checkCep('24020000', [{ zone: 'Centro', bairros: ['Centro'] }])).resolves.toMatchObject({
      status: 'not_covered',
    });
  });

  it('does not call the API for a CEP that is not 8 digits', async () => {
    await expect(checkCep('2022', zones)).resolves.toEqual({ status: 'unresolved' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('gives up cleanly when the CEP does not exist or the API is down', async () => {
    brasilApiReturns({}, false);
    await expect(checkCep('99999999', zones)).resolves.toEqual({ status: 'unresolved' });

    (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));
    await expect(checkCep('20220030', zones)).resolves.toEqual({ status: 'unresolved' });
  });
});
