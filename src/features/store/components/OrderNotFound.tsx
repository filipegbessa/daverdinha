import { MessageCircle } from 'lucide-react';
import { ContactLink } from '@/features/site/components/ContactLink';
import { SiteButton } from '@/features/site/components/SiteButton';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { MY_ORDERS_HREF } from '@/features/site/lib/paths';

const TEXT = {
  not_found: {
    title: 'Pedido não encontrado',
    body: 'Não achamos nenhum pedido com esse link. Confira se o endereço está completo: alguns e-mails quebram o link em duas linhas. Você também pode receber de novo os links dos seus pedidos no seu e-mail.',
  },
  unavailable: {
    title: 'Não conseguimos abrir seu pedido agora',
    body: 'Seu pedido está guardado, mas a página não carregou. Tente de novo em alguns instantes.',
  },
} as const;

/**
 * O que a compradora vê quando o link do pedido não abre: link errado ou
 * incompleto (`not_found`) ou a API fora do ar (`unavailable`). Nos dois
 * casos, um caminho pra seguir: pedir os links de novo ou falar no WhatsApp.
 */
export function OrderNotFound({ reason, retryHref }: { reason: keyof typeof TEXT; retryHref?: string }) {
  const { title, body } = TEXT[reason];
  return (
    <div className="mx-auto max-w-xl space-y-5 py-6 text-center">
      <h1 className="font-serif text-3xl font-semibold text-ink">{title}</h1>
      <p className="text-ink-soft">{body}</p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {reason === 'unavailable' && retryHref ? (
          <SiteButton href={retryHref}>Tentar de novo</SiteButton>
        ) : (
          <SiteButton href={MY_ORDERS_HREF}>Receber os links por e-mail</SiteButton>
        )}
        <ContactLink
          href={getWhatsAppUrl()}
          channel="whatsapp"
          location="order"
          className="flex items-center gap-2 font-semibold text-moss underline underline-offset-4"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          Falar no WhatsApp
        </ContactLink>
      </div>
    </div>
  );
}
