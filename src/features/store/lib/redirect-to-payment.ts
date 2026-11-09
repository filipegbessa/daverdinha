/**
 * Sai do site pra página de pagamento. Navegação completa (não `router.push`):
 * o pagamento é em outro domínio. Separado num módulo pra os testes trocarem,
 * já que o `window.location` do jsdom não pode ser substituído.
 */
export function redirectToPayment(url: string): void {
  window.location.assign(url);
}
