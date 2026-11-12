import { MessageCircle } from 'lucide-react';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { ContactLink } from '@/features/site/components/ContactLink';
import { Footer } from '@/features/site/components/Footer';
import { Header } from '@/features/site/components/Header';
import { CartProvider } from '@/features/store/components/CartProvider';
import { StoreEnabledProvider } from '@/features/store/components/StoreEnabled';
import { isStoreEnabled } from '@/features/store/lib/store-enabled';
import { homeHref } from '@/features/site/lib/paths';
import { WHATSAPP_GREETING } from '@/features/site/lib/whatsapp-messages';

/** O que toda página passa pro `SiteShell`, lido dos interruptores do Dashboard. */
export async function shellProps(): Promise<{ home: string; storeEnabled: boolean }> {
  const [home, storeEnabled] = await Promise.all([homeHref(), isStoreEnabled()]);
  return { home, storeEnabled };
}

/**
 * A moldura de toda página do site completo: cabeçalho, rodapé e o botão
 * flutuante de WhatsApp. Síncrono de propósito — quem busca os dados é a
 * página, inclusive o interruptor da loja (`shellProps()`), que vai pros
 * componentes de cliente pelo `StoreEnabledProvider`. Com a loja ligada,
 * envolve tudo no carrinho.
 */
export function SiteShell({
  home,
  storeEnabled,
  preview = false,
  children,
}: {
  home: string;
  /** Interruptor "Loja" do Dashboard (`shellProps()` ou `isStoreEnabled()`). */
  storeEnabled: boolean;
  /** Algum dado da página é exemplo (ver `data/samples.ts`): mostra o aviso de prévia. */
  preview?: boolean;
  children: React.ReactNode;
}) {
  // Coluna com no mínimo a altura da tela e o <main> crescendo: em página
  // curta (carrinho com poucos itens) o rodapé fica no fim da tela, sem faixa
  // vazia embaixo dele.
  const page = (
    <div className="flex min-h-dvh flex-col">
      {preview && (
        <p className="bg-berry px-4 py-1.5 text-center text-xs font-medium text-paper">
          Prévia do site: os produtos, preços e eventos são exemplos para validar o layout.
        </p>
      )}
      <Header home={home} storeEnabled={storeEnabled} />
      {/* Fundo das seções da página: claro e areia alternados, contados pelas
          seções que de fato aparecem (seção vazia que retorna null não
          quebra a sequência). Nenhuma seção de página define o próprio fundo. */}
      <main className="flex-1 [&>section:nth-of-type(even)]:bg-sand">{children}</main>
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
    </div>
  );
  return (
    <StoreEnabledProvider value={storeEnabled}>
      {storeEnabled ? <CartProvider>{page}</CartProvider> : page}
    </StoreEnabledProvider>
  );
}
