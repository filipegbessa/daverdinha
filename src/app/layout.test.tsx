import { metadata } from './layout';

describe('RootLayout metadata', () => {
  it('sets the real page title and description', () => {
    expect(metadata.title).toBe('Daverdinha — Ateliê de plantas no Rio de Janeiro');
    expect(metadata.description).toBe(
      'Vasos, mudas e um cantinho verde pra chamar de seu. Atendimento e entrega combinados direto pelo WhatsApp.',
    );
  });

  it('sets Open Graph and Twitter card metadata', () => {
    const openGraph = metadata.openGraph as { title?: string; type?: string } | null;
    const twitter = metadata.twitter as { card?: string } | null;
    expect(openGraph?.title).toBe('Daverdinha — Ateliê de plantas no Rio de Janeiro');
    expect(openGraph?.type).toBe('website');
    expect(twitter?.card).toBe('summary_large_image');
  });
});
