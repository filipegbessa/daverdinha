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

  it('carries the Facebook domain verification token', () => {
    // `verification.other` é o que o Next traduz para
    // `<meta name="facebook-domain-verification" content="...">`. Fica no
    // layout raiz porque a verificação olha o domínio, não uma página.
    const verification = metadata.verification as {
      other?: Record<string, string>;
    } | null;
    expect(verification?.other?.['facebook-domain-verification']).toBe(
      'i3ox0yxj3vbn6jc6m4bzm2smhb700s',
    );
  });
});
