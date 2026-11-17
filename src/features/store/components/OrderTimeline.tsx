import { Check } from 'lucide-react';
import type { PublicSiteOrder } from '@/features/store/types/store';

type Step = { label: string; state: 'done' | 'current' | 'upcoming' };

/**
 * Os passos de um pedido de produtos, do pedido feito à entrega. `current` é
 * o próximo passo, o que está acontecendo agora ou sendo esperado; os de
 * antes estão feitos. Pedido vencido, cancelado ou estornado não tem linha do
 * tempo (a página explica o que houve), nem pedido de ingresso.
 */
export function orderSteps(order: PublicSiteOrder): Step[] | null {
  if (order.kind !== 'products') return null;
  if (order.status !== 'pending_payment' && order.status !== 'paid') return null;
  const pickup = order.deliveryMethod === 'pickup';
  const labels = [
    'Pedido feito',
    'Pagamento confirmado',
    'Em preparo',
    pickup ? 'Pronto para retirar' : 'Saiu para entrega',
    pickup ? 'Retirado' : 'Entregue',
  ];
  const current =
    order.status === 'pending_payment'
      ? 1
      : { awaiting: 2, preparing: 2, ready: 4, completed: labels.length }[order.fulfillmentStatus];
  return labels.map((label, index) => ({
    label,
    state: index < current ? 'done' : index === current ? 'current' : 'upcoming',
  }));
}

/** A linha do tempo do pedido: na horizontal no computador, na vertical no celular. */
export function OrderTimeline({ order }: { order: PublicSiteOrder }) {
  const steps = orderSteps(order);
  if (!steps) return null;
  return (
    <ol aria-label="Andamento do pedido" className="flex flex-col gap-3 sm:flex-row sm:gap-2">
      {steps.map((step, index) => (
        <li
          key={step.label}
          aria-current={step.state === 'current' ? 'step' : undefined}
          className="flex items-center gap-3 sm:flex-1 sm:flex-col sm:items-start sm:gap-2"
        >
          <span className="flex w-full items-center gap-2">
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                step.state === 'done'
                  ? 'border-moss bg-moss text-paper'
                  : step.state === 'current'
                    ? 'border-moss bg-paper text-moss'
                    : 'border-sand-line bg-paper text-ink-soft'
              }`}
            >
              {step.state === 'done' ? <Check className="size-4" aria-hidden="true" /> : index + 1}
            </span>
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`hidden h-0.5 flex-1 rounded sm:block ${step.state === 'done' ? 'bg-moss' : 'bg-sand-line'}`}
              />
            )}
          </span>
          <span className={`text-sm ${step.state === 'upcoming' ? 'text-ink-soft' : 'font-semibold text-ink'}`}>
            {step.label}
            <span className="sr-only">
              {step.state === 'done' ? ' (concluído)' : step.state === 'current' ? ' (agora)' : ''}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
