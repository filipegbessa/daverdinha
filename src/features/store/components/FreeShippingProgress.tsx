import { Truck } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { CheckoutQuote } from '@/features/store/types/store';

/**
 * "Faltam R$ 40,30 para frete grátis", com a barrinha de progresso; chegando
 * lá, "Você ganhou frete grátis!". Vem do frete grátis automático das
 * Promoções (`quote.freeShipping`). Uma linha só, pra não empurrar o botão de
 * finalizar pra baixo no celular.
 */
export function FreeShippingProgress({ freeShipping }: { freeShipping: CheckoutQuote['freeShipping'] }) {
  if (!freeShipping) return null;
  const { minSubtotal, remaining, reached } = freeShipping;
  const progress = reached ? 100 : Math.max(0, Math.min(100, ((minSubtotal - remaining) / minSubtotal) * 100));
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-2 text-sm text-ink">
        <Truck className="size-4 shrink-0 text-moss" aria-hidden="true" />
        {reached ? (
          <strong className="text-moss">Você ganhou frete grátis!</strong>
        ) : (
          <span>
            Faltam <strong className="tabular-nums">{formatPrice(remaining)}</strong> para frete grátis
          </span>
        )}
      </p>
      <div
        role="progressbar"
        aria-label="Progresso até o frete grátis"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        className="h-1.5 overflow-hidden rounded-full bg-sand-line"
      >
        <div className="h-full rounded-full bg-moss transition-[width]" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
