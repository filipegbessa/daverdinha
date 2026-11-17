import { SiteShell, shellProps } from '@/features/site/components/SiteShell';
import { OrderNotFound } from '@/features/store/components/OrderNotFound';

/**
 * O 404 do `/pedido/<token>`: link errado, incompleto ou de um pedido que não
 * existe (por exemplo, criado num ambiente de teste). Continua respondendo
 * 404, mas com o caminho pra recuperar os links em vez da página genérica.
 */
export default async function OrderNotFoundPage() {
  const shell = await shellProps();
  return (
    <SiteShell {...shell}>
      <section className="px-6 py-10 md:py-14">
        <OrderNotFound reason="not_found" />
      </section>
    </SiteShell>
  );
}
