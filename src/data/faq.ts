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
      'Entregamos em toda a Zona Sul, Centro, Zona Portuária e parte da Zona Norte do Rio de Janeiro. Fora dessas áreas, ainda não conseguimos atender.',
  },
];
