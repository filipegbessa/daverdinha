import Link from 'next/link';
import { CheckCircle2, Clock, MessageCircle, XCircle } from 'lucide-react';
import { ContactLink } from '@/features/site/components/ContactLink';
import { formatClock, formatPrice } from '@/lib/format';
import { PRODUCTS_HREF } from '@/features/site/lib/paths';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import type { FulfillmentStatus, PublicSiteOrder } from '@/features/store/types/store';
import { orderStatusMessage } from '@/features/site/lib/whatsapp-messages';
import { Eyebrow } from '@/features/site/components/Eyebrow';

const FULFILLMENT: Record<FulfillmentStatus, string> = {
  awaiting: 'Pedido recebido, logo começamos a preparar.',
  preparing: 'Estamos preparando o seu pedido.',
  ready: 'Pronto! Já pode retirar ou está saindo pra entrega.',
  completed: 'Pedido entregue. Obrigada pela compra!',
};

const HEADLINE: Record<PublicSiteOrder['status'], { title: string; icon: typeof Clock; tone: string }> = {
  pending_payment: { title: 'Aguardando pagamento', icon: Clock, tone: 'text-ink' },
  paid: { title: 'Pedido confirmado!', icon: CheckCircle2, tone: 'text-moss' },
  expired: { title: 'O prazo de pagamento acabou', icon: XCircle, tone: 'text-berry' },
  cancelled: { title: 'Pedido cancelado', icon: XCircle, tone: 'text-berry' },
  refunded: { title: 'Pagamento estornado', icon: XCircle, tone: 'text-berry' },
};

/**
 * A página do pedido, de acordo com o status. Sem endereço completo nem
 * contato: quem tem o link vê esta página.
 */
export function OrderStatus({ order, reloadHref }: { order: PublicSiteOrder; reloadHref: string }) {
  const { title, icon: Icon, tone } = HEADLINE[order.status];
  const maxLeadTime = Math.max(0, ...order.items.map((i) => i.leadTimeDays ?? 0));
  const whatsapp = getWhatsAppUrl(orderStatusMessage(order.code));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <div>
          <Eyebrow className="text-sm text-ink-soft">Pedido {order.code}</Eyebrow>
          <h1 className={`mt-2 flex items-center gap-3 font-serif text-3xl font-semibold md:text-4xl ${tone}`}>
            <Icon className="size-8 shrink-0" aria-hidden="true" />
            {title}
          </h1>
        </div>

        {order.status === 'pending_payment' && (
          <div className="space-y-4 rounded-2xl border border-sand-line bg-sand/60 p-5">
            <p>
              Você tem até <strong>{formatClock(order.expiresAt)}</strong> pra pagar. Depois disso o pedido é cancelado
              e os itens voltam pra loja.
            </p>
            <div className="flex flex-wrap gap-3">
              {order.paymentUrl && (
                <a
                  href={order.paymentUrl}
                  className="inline-flex items-center justify-center rounded-full bg-moss px-6 py-3 font-semibold text-paper shadow-card hover:bg-moss/90"
                >
                  Pagar agora
                </a>
              )}
              {/* Recarrega a página: a API confere o pagamento quando o pedido é lido. */}
              <a
                href={reloadHref}
                className="inline-flex items-center justify-center rounded-full border border-moss-line px-6 py-3 font-semibold text-ink hover:bg-moss/10"
              >
                Já paguei
              </a>
            </div>
          </div>
        )}

        {order.status === 'paid' && (
          <div className="space-y-2 rounded-2xl border border-moss-line bg-moss/5 p-5">
            <p className="font-semibold text-ink">{FULFILLMENT[order.fulfillmentStatus]}</p>
            {order.deliveryMethod === 'delivery' && <p>Entrega em {order.bairro}.</p>}
            {order.pickup && (
              <div>
                <p>Retirada no ateliê: {order.pickup.address}</p>
                <p className="text-ink-soft">{order.pickup.hours}</p>
                {order.pickup.instructions && <p className="text-ink-soft">{order.pickup.instructions}</p>}
              </div>
            )}
            {maxLeadTime > 0 && (
              <p className="text-sm text-ink-soft">
                Tem item sob encomenda: a {order.deliveryMethod === 'pickup' ? 'retirada' : 'entrega'} acontece depois
                da confecção, em até {maxLeadTime} dias.
              </p>
            )}
          </div>
        )}

        {order.status === 'expired' && (
          <p>
            Nenhum valor foi cobrado.{' '}
            <Link href={PRODUCTS_HREF} className="font-semibold text-moss underline underline-offset-4">
              Ver produtos
            </Link>{' '}
            pra montar o carrinho de novo.
          </p>
        )}

        {(order.status === 'cancelled' || order.status === 'refunded') && (
          <p>Se tiver alguma dúvida sobre o cancelamento, fale com a gente pelo WhatsApp.</p>
        )}

        <ContactLink
          href={whatsapp}
          channel="whatsapp"
          location="order"
          className="inline-flex items-center gap-2 font-semibold text-moss underline underline-offset-4"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          Falar no WhatsApp sobre o pedido {order.code}
        </ContactLink>
      </div>

      <aside className="h-fit space-y-3 rounded-2xl border border-sand-line bg-sand/60 p-5">
        <h2 className="font-serif text-xl font-semibold text-ink">Itens</h2>
        <ul className="space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={`${item.name}-${item.slug}`} className="flex justify-between gap-3">
              <span>
                {item.quantity}× {item.name}
                {item.leadTimeDays && (
                  <span className="block text-ink-soft">Sob encomenda · até {item.leadTimeDays} dias</span>
                )}
              </span>
              <span className="tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t border-sand-line pt-3">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
          </p>
          <p className="flex justify-between">
            <span>{order.deliveryMethod === 'pickup' ? 'Retirada' : 'Entrega'}</span>
            <span className="tabular-nums">{order.deliveryFee === 0 ? 'Grátis' : formatPrice(order.deliveryFee)}</span>
          </p>
          <p className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(order.total)}</span>
          </p>
        </div>
      </aside>
    </div>
  );
}
