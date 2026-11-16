import { fetchStreetByCep } from './address-by-cep';

/** Resposta mínima de `fetch`: o jsdom dos testes não tem `Response`. */
function reply(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('fetchStreetByCep', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  it('returns the street for a CEP that ViaCEP resolves', async () => {
    fetchMock.mockResolvedValue(reply(200, { logradouro: 'Rua do Catete', bairro: 'Catete' }));

    await expect(fetchStreetByCep('22220000')).resolves.toBe('Rua do Catete');
    expect(fetchMock).toHaveBeenCalledWith('https://viacep.com.br/ws/22220000/json/');
  });

  it('strips the mask before calling ViaCEP', async () => {
    fetchMock.mockResolvedValue(reply(200, { logradouro: 'Rua do Catete' }));

    await fetchStreetByCep('22220-000');

    expect(fetchMock).toHaveBeenCalledWith('https://viacep.com.br/ws/22220000/json/');
  });

  it('returns null for a CEP ViaCEP does not recognize', async () => {
    fetchMock.mockResolvedValue(reply(200, { erro: true }));

    await expect(fetchStreetByCep('00000000')).resolves.toBeNull();
  });

  it('returns null for an incomplete CEP, without calling ViaCEP', async () => {
    await expect(fetchStreetByCep('2222')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(fetchStreetByCep('22220000')).resolves.toBeNull();
  });

  it('returns null when the response is not ok', async () => {
    fetchMock.mockResolvedValue(reply(500, {}));

    await expect(fetchStreetByCep('22220000')).resolves.toBeNull();
  });
});
