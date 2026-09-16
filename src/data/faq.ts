export interface FaqItem {
  question: string;
  answer: string;
}

// Mais itens entram aqui assim que a cliente responder as perguntas de FAQ em PERGUNTAS-CLIENTE-SITE.md.
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Como faço um pedido?',
    answer:
      'É rapidinho: manda uma mensagem pra gente no WhatsApp e nosso atendimento automático já te ajuda a encontrar o que precisa.',
  },
  {
    question: 'Para quais regiões vocês entregam?',
    answer:
      'Atendemos vários bairros do Rio de Janeiro — a lista atualizada fica na seção "Onde entregamos" aqui do site. Se tiver dúvida sobre o seu, é só mandar seu CEP no WhatsApp que a gente confirma na hora.',
  },
];
