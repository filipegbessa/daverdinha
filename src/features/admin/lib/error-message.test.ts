import { errorMessage } from './error-message';

describe('errorMessage', () => {
  it('uses the message of an Error', () => {
    expect(errorMessage(new Error('Bairro não encontrado.'), 'Erro.')).toBe('Bairro não encontrado.');
  });

  it('falls back when the thrown value is not an Error or has no message', () => {
    expect(errorMessage('boom', 'Erro ao salvar.')).toBe('Erro ao salvar.');
    expect(errorMessage(new Error(''), 'Erro ao salvar.')).toBe('Erro ao salvar.');
  });
});
