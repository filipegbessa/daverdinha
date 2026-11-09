import type { Product } from '@/features/site/types/catalog';

const BADGE = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold';

const STYLES: Record<Product['availability'], string> = {
  in_stock: 'bg-moss/10 text-moss',
  made_to_order: 'bg-berry/10 text-berry',
  sold_out: 'bg-sand-line text-ink-soft',
};

/** "até 10 dias", ou nada quando a cliente ainda não cadastrou o prazo. */
function leadTime(product: Pick<Product, 'leadTimeDays'>): string | null {
  const days = product.leadTimeDays;
  if (!days) return null;
  return days === 1 ? 'até 1 dia' : `até ${days} dias`;
}

/**
 * Como o produto está à venda: "Pronta entrega", "Sob encomenda" ou
 * "Esgotado". No card cabe numa linha ("Sob encomenda · até 10 dias"); na
 * página do produto, o prazo vira uma frase embaixo do selo.
 */
export function AvailabilityBadge({
  product,
  detailed = false,
}: {
  product: Pick<Product, 'availability' | 'leadTimeDays'>;
  /** Página do produto: explica o prazo de confecção numa linha à parte. */
  detailed?: boolean;
}) {
  const style = `${BADGE} ${STYLES[product.availability]}`;

  if (product.availability === 'in_stock') return <span className={style}>Pronta entrega</span>;
  if (product.availability === 'sold_out') return <span className={style}>Esgotado</span>;

  const days = leadTime(product);
  if (!detailed) {
    return <span className={style}>{days ? `Sob encomenda · ${days}` : 'Sob encomenda'}</span>;
  }
  return (
    <div>
      <span className={style}>Sob encomenda</span>
      <p className="mt-2 text-sm text-ink-soft">
        {days
          ? `Feito pra você: a confecção leva ${days}, antes da entrega ou retirada.`
          : 'Feito pra você: o prazo de confecção é combinado pelo WhatsApp.'}
      </p>
    </div>
  );
}
