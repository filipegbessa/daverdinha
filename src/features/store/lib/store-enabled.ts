import { getSiteSettings } from '@/lib/site-settings';

/**
 * A loja do site está ligada? Vem do interruptor "Loja" do Dashboard (ver
 * `lib/site-settings.ts`). Ligada: botão de comprar, ícone do carrinho,
 * `/carrinho`, `/checkout` e `/pedido`. Desligada: compra pelo WhatsApp, e as
 * rotas da loja respondem 404.
 *
 * Server-only. Componente de cliente usa `useStoreEnabled()`
 * (`features/store/components/StoreEnabled.tsx`).
 */
export async function isStoreEnabled(): Promise<boolean> {
  return (await getSiteSettings()).storeEnabled;
}
