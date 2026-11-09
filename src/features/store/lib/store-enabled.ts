/**
 * Liga a loja do site: botão de comprar, ícone do carrinho e `/carrinho`.
 * Fora de `'true'` exato, o site fica como antes da loja (só WhatsApp), e as
 * rotas da loja respondem 404. É `NEXT_PUBLIC_` porque o botão e o ícone são
 * componentes de cliente; mudar a variável na Vercel vale a partir do
 * próximo deploy.
 */
export function isStoreEnabled(): boolean {
  return process.env.NEXT_PUBLIC_STORE_ENABLED === 'true';
}
