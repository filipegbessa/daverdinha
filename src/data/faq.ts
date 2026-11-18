import { formatPrice } from '@/lib/format';

export interface FaqItem {
  question: string;
  answer: string;
  /** Um link no fim da resposta, pra página que explica melhor. */
  link?: { href: string; label: string };
}

/**
 * O que as respostas tiram do admin (`GET /store-settings/public`), pra não
 * ficarem desatualizadas: com a loja ou a venda de ingressos desligada, as
 * perguntas de compra pelo site somem; a retirada e as parcelas usam o que
 * está cadastrado. Sem API, vale o padrão: tudo pelo WhatsApp.
 */
export interface FaqContext {
  storeEnabled: boolean;
  ticketsEnabled: boolean;
  maxInstallments: number;
  minInstallmentValue: number;
  pickup: { address: string; hours: string } | null;
}

export const DEFAULT_FAQ_CONTEXT: FaqContext = {
  storeEnabled: false,
  ticketsEnabled: false,
  maxInstallments: 1,
  minInstallmentValue: 0,
  pickup: null,
};

function installmentsText(ctx: FaqContext): string {
  if (ctx.maxInstallments <= 1) return 'Pix ou cartão de crédito à vista.';
  const minimum = ctx.minInstallmentValue > 0 ? `, com parcela mínima de ${formatPrice(ctx.minInstallmentValue)}` : '';
  return `Pix ou cartão de crédito, em até ${ctx.maxInstallments}x sem juros${minimum}.`;
}

/**
 * As perguntas frequentes da home, na ordem em que aparecem. As de trocas e
 * de cancelamento de ingresso resumem as páginas de política e linkam pra
 * elas: o texto completo vale lá. Pra a cliente editar sozinha, o plano é o
 * pacote 5.6 (FAQ pelo admin), em `daverdinha-api/docs/estado-da-loja.md`.
 */
export function faqItems(ctx: FaqContext = DEFAULT_FAQ_CONTEXT): FaqItem[] {
  const items: (FaqItem | false | null)[] = [
    {
      question: 'Como faço um pedido?',
      answer: ctx.storeEnabled
        ? 'Pelo site: escolha os produtos na Loja, coloque no carrinho e finalize a compra, com entrega ou retirada. Se preferir, também dá pra pedir pelo WhatsApp, e nosso atendimento te ajuda a encontrar o que precisa.'
        : 'É rapidinho: manda uma mensagem pra gente no WhatsApp e nosso atendimento automático já te ajuda a encontrar o que precisa.',
      ...(ctx.storeEnabled && { link: { href: '/produtos', label: 'Ir para a Loja' } }),
    },
    ctx.storeEnabled && {
      question: 'Quais formas de pagamento vocês aceitam?',
      answer: `${installmentsText(ctx)} O pagamento é feito no ambiente seguro do Pagar.me, e o pedido é confirmado assim que o pagamento é aprovado.`,
    },
    {
      question: 'O que é "sob encomenda" e quanto tempo demora?',
      answer:
        'Algumas peças são feitas no ateliê depois do pedido, como arranjos e kits montados. Elas aparecem com o selo "Sob encomenda" e o prazo de confecção em dias, na loja e na página do produto. Os produtos de "Pronta entrega" já estão prontos pra sair.',
    },
    {
      question: 'Para quais regiões vocês entregam?',
      answer:
        'Entregamos em vários bairros do Rio de Janeiro: a lista atualizada fica na seção "Onde entregamos" aqui do site. Na página de cada produto, dá pra digitar o CEP e ver se entregamos e quanto custa. Quando há promoção de frete grátis, o carrinho mostra quanto falta pra ganhar.',
      link: { href: '/entrega-e-retirada', label: 'Entrega e retirada' },
    },
    ctx.pickup && {
      question: 'Posso retirar no ateliê?',
      answer: `Sim, sem custo. A retirada é em ${ctx.pickup.address}, ${ctx.pickup.hours}. Escolha "Retirar no ateliê" ao finalizar a compra.`,
    },
    ctx.storeEnabled && {
      question: 'Como acompanho meu pedido?',
      answer:
        'Depois do pagamento você recebe um e-mail com o link do pedido, que mostra cada etapa: pago, em preparo e pronto ou saiu pra entrega. Perdeu o e-mail? Em "Meus pedidos" a gente manda os links de novo.',
      link: { href: '/meus-pedidos', label: 'Meus pedidos' },
    },
    ctx.storeEnabled && {
      question: 'Posso trocar ou devolver?',
      answer:
        'Sim. Em compras pela internet você pode desistir em até 7 dias depois de receber, e produto com defeito tem troca garantida. As condições e o passo a passo estão na nossa política de trocas.',
      link: { href: '/trocas-e-devolucoes', label: 'Trocas e devoluções' },
    },
    ctx.storeEnabled && {
      question: 'Como uso um cupom de desconto?',
      answer:
        'Digite o código no campo "Cupom" ao finalizar a compra. O desconto aparece no resumo antes do pagamento. Cada cupom tem as próprias regras, como valor mínimo e validade, e não vale pra produtos que já estão em promoção.',
    },
    ctx.ticketsEnabled && {
      question: 'Como compro ingresso pra uma oficina ou evento?',
      answer:
        'Na página do evento, escolha quantas pessoas vão e preencha o nome de cada uma. Depois do pagamento (ou da inscrição, nos eventos gratuitos), o ingresso chega por e-mail com um QR code, que a gente lê na entrada.',
      link: { href: '/agenda', label: 'Ver eventos' },
    },
    ctx.ticketsEnabled && {
      question: 'Posso cancelar um ingresso?',
      answer:
        'Fale com a gente pelo WhatsApp ou por e-mail com o código do pedido. As condições de cancelamento estão na nossa política de trocas.',
      link: { href: '/trocas-e-devolucoes', label: 'Trocas e devoluções' },
    },
    {
      question: 'Como cuido da minha planta?',
      answer:
        'Cada produto traz na descrição as dicas de luz e rega. Ficou com dúvida depois de receber? Chama a gente no WhatsApp, que a gente ajuda.',
    },
  ];
  return items.filter((item): item is FaqItem => Boolean(item));
}
