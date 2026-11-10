import { MessageCircle } from 'lucide-react';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { ContactLink } from '@/features/site/components/ContactLink';
import { Footer } from '@/features/site/components/Footer';
import { Header } from '@/features/site/components/Header';
import { CartProvider } from '@/features/store/components/CartProvider';
import { isStoreEnabled } from '@/features/store/lib/store-enabled';
import { WHATSAPP_GREETING } from '@/features/site/lib/whatsapp-messages';

/**
 * A moldura de toda página do site completo: cabeçalho, rodapé e o botão
 * flutuante de WhatsApp. Síncrono de propósito — quem busca os dados é a
 * página. Com a loja ligada, envolve tudo no carrinho.
 */
export function SiteShell({
  home,
  preview = false,
  children,
}: {
  home: string;
  /** Algum dado da página é exemplo (ver `data/samples.ts`): mostra o aviso de prévia. */
  preview?: boolean;
  children: React.ReactNode;
}) {
  const page = (
    <>
      {preview && (
        <p className="bg-berry px-4 py-1.5 text-center text-xs font-medium text-paper">
          Prévia do site: os produtos, preços e eventos são exemplos para validar o layout.
        </p>
      )}
      <Header home={home} />
      {/* Fundo das seções da página: claro e areia alternados, contados pelas
          seções que de fato aparecem (seção vazia que retorna null não
          quebra a sequência). Nenhuma seção de página define o próprio fundo. */}
      <main className="[&>section:nth-of-type(even)]:bg-sand">{children}</main>
      <Footer home={home} />
      <ContactLink
        href={getWhatsAppUrl(WHATSAPP_GREETING)}
        channel="whatsapp"
        location="floating"
        aria-label="Falar no WhatsApp"
        className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full bg-moss text-paper shadow-soft sm:hidden"
      >
        <MessageCircle className="size-6" aria-hidden="true" />
      </ContactLink>
    </>
  );
  return isStoreEnabled() ? <CartProvider>{page}</CartProvider> : page;
}
