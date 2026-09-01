import { metadata } from './layout';

describe('RootLayout metadata', () => {
  it('sets the real page title and description', () => {
    expect(metadata.title).toBe('Da Verdinha — Ateliê de plantas no Rio de Janeiro');
    expect(metadata.description).toBe(
      'Vasos, mudas e um cantinho verde pra chamar de seu. Atendimento e entrega combinados direto pelo WhatsApp.',
    );
  });
});
