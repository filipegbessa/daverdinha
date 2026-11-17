import Link from 'next/link';
import { Loader2 } from 'lucide-react';

/**
 * O que aparece depois que o pedido foi criado, enquanto o navegador sai pro
 * Pagar.me. Sem ela a página voltava a desenhar o checkout (ou o carrinho já
 * vazio) por alguns segundos, e parecia que a compra tinha sumido. Os links
 * cobrem o caso de o redirecionamento não acontecer.
 */
export function RedirectingToPayment({
  code,
  token,
  paymentUrl,
  title = 'Pedido criado!',
}: {
  code: string;
  token: string;
  paymentUrl: string;
  title?: string;
}) {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-lg space-y-5 py-10 text-center">
      <Loader2 className="mx-auto size-10 animate-spin text-moss" aria-hidden="true" />
      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-semibold text-ink">{title}</h2>
        <p className="text-ink-soft">
          Seu pedido <strong className="text-ink">{code}</strong> foi registrado. Estamos levando você para a página de
          pagamento seguro do Pagar.me, com Pix ou cartão…
        </p>
      </div>
      <p className="text-sm text-ink-soft">
        Se a página não abrir em alguns segundos,{' '}
        <a href={paymentUrl} className="font-semibold text-moss underline underline-offset-4">
          clique aqui para pagar
        </a>
        .
      </p>
      <Link
        href={`/pedido/${encodeURIComponent(token)}`}
        className="inline-block text-sm font-semibold text-moss underline underline-offset-4"
      >
        Ver meu pedido
      </Link>
    </div>
  );
}
