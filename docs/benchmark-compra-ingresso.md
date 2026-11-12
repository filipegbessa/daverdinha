# Benchmark: compra de ingresso

Pesquisa de 2026-11-12, pra redesenhar a compra de ingresso do site. Antes, o formulário inteiro (participantes, dados do comprador, resumo e botão de pagar) ficava dentro da página do evento, embaixo da descrição. A proposta abaixo, de um botão "Comprar ingresso" que leva a um checkout próprio, foi implementada no mesmo dia (`TicketPurchaseBox` na página do evento, `TicketCheckout` em `/agenda/[slug]/ingressos`).

**Limite da pesquisa:** as plataformas foram lidas pela central de ajuda e por material público, não por uma compra de teste em cada uma. As telas mudam com frequência e cada organizador configura campos diferentes. Antes de fechar o layout, vale abrir um evento real da Sympla e um da Ingresse no celular e passar pelo fluxo até a tela de pagamento.

## O que o mercado faz

| Plataforma | Página do evento | Seleção | Dados pedidos antes de pagar | Participantes | Tempo de reserva | Login |
|---|---|---|---|---|---|---|
| **Sympla** | Botão de compra leva à seleção de ingressos | Tipo de ingresso/lote, valor e regras de cada um | Dados do comprador e, quando o organizador pede, dados para nota fiscal | Dados por ingresso quando há mais de um participante (configurável); edição limitada depois | Sem prazo confirmado nas fontes | Conta Sympla |
| **Ingresse** | "Comprar Ingressos" | Setor, tipo (inteira/meia) e quantidade, depois "avançar" | Login, quem usa cada ingresso (no site), cartão ou Pix | No site, antes de pagar; no app, a compra fica no nome do comprador e transfere depois | Prazo na tela de checkout; vencido, o ingresso volta ao lote | Obrigatório (cria na hora) |
| **Eventbrite** | Botão com texto do organizador ("Register", "Reserve a spot") | Seleção de ingressos, depois "Check out" | Nome e e-mail do comprador; o resto só se o organizador marcar como obrigatório | Opção "cada participante", com perguntas não obrigatórias depois do pagamento | Reserva com prazo configurável pelo organizador; ingresso fica bloqueado até vencer | Opcional |
| **Tito** | Página do evento com os tipos de ingresso | Seleção e cobrança na mesma etapa | Só o mínimo pra fechar a compra | Depois do pagamento, ingresso por ingresso, quando quiser | 15 min, e o contador só aparece quando o resto esgotou | Não |
| **Even3** | Página de inscrição | Tipo de inscrição | Pagamento primeiro, porque formulário longo faz desistir; nota fiscal (CPF, endereço) quando precisa | Recomenda deixar um e-mail comprar vários, com dados de um participante só | Não informado | Não informado |
| **Shotgun** (venda na porta) | QR na entrada | Ingresso único | Nada além do pagamento: Apple Pay, Google Pay ou cartão | Não pede | Não informado | Não |

## O que se repete

1. **A página do evento vende, não preenche.** Em todas, a página do evento mostra data, local, preço e um botão de compra. O formulário fica em outra tela (Sympla, Ingresse, Eventbrite) ou num passo separado. A página do evento continua sendo pra decidir, não pra digitar.
2. **Escolher a quantidade antes de preencher.** Ingresse e Sympla pedem tipo e quantidade primeiro; os campos aparecem depois, já do tamanho certo. Hoje o nosso formulário começa com um participante e cresce com "+ Adicionar participante".
3. **Menos campos antes de pagar converte mais.** O Eventbrite diz que levar as perguntas não obrigatórias pra depois do pagamento dobrou a conversão em alguns casos. Tito e Even3 seguem a mesma linha. O nome de cada participante é o único dado extra que a gente pede, e ele é necessário pra lista de presença. Continua antes do pagamento, mas sem nada além dele.
4. **Resumo do pedido sempre à vista.** A Baymard recomenda que o resumo fique visível na etapa de pagamento, e no celular recolhido mas acessível, em vez de escondido.
5. **Compra sem login.** A Baymard aponta a compra como convidado, visível e no começo, como ponto de atrito comum. Ingresse obriga login; Eventbrite e Tito não. A gente já não pede conta e deve continuar assim.
6. **Indicador de etapas que bate com as etapas de verdade.** Quando há mais de um passo, o indicador mostra todos, na ordem real (Baymard).
7. **Contador de tempo só quando ajuda.** Ingresse e Eventbrite seguram a vaga por um prazo. O Tito só mostra o contador quando o resto esgotou, pra não apressar ninguém sem motivo, e uma crítica pública ao Eventbrite cita o contador correndo como fonte de ansiedade.

## Proposta pra Daverdinha

O contexto é diferente dos grandes: um tipo de ingresso por evento, poucas vagas, quase sempre pagamento no Pagar.me (página dele, fora do site), e inscrição gratuita sem pagamento.

### Página do evento (`/agenda/[slug]`)

- Bloco de compra perto do topo: preço ("R$ 45,00 por pessoa" ou "Gratuito"), vagas ("Restam 4 vagas", só quando há limite), seletor de quantidade (− 1 +, até o menor entre o limite por compra e as vagas) e o botão **"Comprar ingresso"** ou **"Inscrever-se"**.
- No celular, uma barra fixa no rodapé com preço e o botão, pra o botão não sumir enquanto a pessoa lê a descrição.
- Esgotado: o botão vira "Esgotado", desabilitado, com "Falar no WhatsApp" pra lista de espera informal.
- Nenhum campo de texto na página do evento.

### Checkout (`/agenda/[slug]/ingressos?quantidade=2`)

Uma página só, em blocos, sem login. É curta demais pra virar várias etapas.

1. **Cabeçalho do evento:** foto pequena, título, data e local (no resumo), com "Voltar ao evento".
2. **Seus dados:** nome, e-mail e WhatsApp, com a explicação curta de pra que servem ("pra mandar a confirmação e avisar se algo mudar"). Vem antes dos participantes, pra o nome do comprador já valer como primeiro participante.
3. **Participantes:** um campo de nome por ingresso, já na quantidade escolhida, com o seletor de quantidade ao lado. "Eu vou participar" vem marcado e faz do comprador o primeiro participante, pra não digitar o nome duas vezes; desmarcado, o primeiro campo fica livre.
4. **Resumo:** "2 × R$ 45,00 = R$ 90,00" ou "Gratuito", e o parcelamento quando tiver. No computador, numa coluna à direita que acompanha a rolagem; no celular, recolhido no topo ("Resumo · R$ 90,00 ▾") e repetido acima do botão.
5. **Botão final:** "Ir para o pagamento" (pago) ou "Confirmar inscrição" (gratuito), com a frase "A vaga fica reservada por 60 minutos enquanto você paga" no pago. Sem contador nesta tela: a reserva só começa quando o pedido é criado, no clique.

Erros que já existem continuam, agora na tela certa: vagas acabaram enquanto preenchia (ajusta a quantidade e avisa), venda fechada (volta pro evento com o WhatsApp), Pagar.me fora do ar (mensagem e botão de novo).

### Depois

- Pagamento no Pagar.me, como hoje. Volta pra `/pedido/<token>` com "Ingresso confirmado!" ou "Inscrição confirmada!" e os nomes, como já está.
- O aceite da política de cancelamento entra no checkout quando a página `/cancelamento-de-ingressos` existir (depende do `questionario-ingressos.md`).

### Por que uma página, e não etapas

O mercado divide em etapas porque tem lote, setor, meia-entrada, login e nota fiscal. Aqui são três blocos pequenos e o pagamento já acontece fora do site. Dividir só acrescentaria cliques. Se um dia entrar tipo de ingresso (meia, lote), a seleção ganha um passo próprio antes deste.

## Fontes

- [Ingresse: como comprar ingressos pelo site ou aplicativo](https://meajuda.ingresse.com/support/solutions/articles/8000103636-como-comprar-ingressos-pelo-site-ou-aplicativo-da-ingresse-)
- [Eventbrite: Checkout on Eventbrite](https://support.eventbrite.com/hc/en-us/articles/34823220365970-Checkout-on-Eventbrite)
- [Eventbrite: tempo limite de registro](https://www.eventbrite.com/help/en-us/articles/435853/how-to-increase-or-decrease-the-amount-of-time-to-complete-an-order/)
- [Donorfy: o checkout novo do Eventbrite e as perguntas por participante](https://help-donorfy.theaccessgroup.com/en/articles/14528659-understand-eventbrite-s-better-checkout-experience-and-its-impact-on-donorfy)
- [Tito: Ticket Purchase Flow, an Evolution](https://blog.tito.io/posts/ticket-purchase-flow/)
- [Even3: venda de inscrições](https://plataforma.even3.com.br/venda-inscricoes-para-eventos/) e [checkout da Even3](https://publicacoes.even3.com.br/Checkout/ff00d72b-7391-4472-b8cf-c1e5ce5409a2)
- [Shotgun: Xpress Door](https://support-pro.shotgun.live/hc/en-us/articles/9796795310610-Xpress-Door-Flawlessly-sell-tickets-at-the-entrance-of-your-events)
- [Guia de terceiros sobre a compra na Sympla](https://cidesp.com.br/v3/conteudo/sympla-como-acessar-sua-conta-e-comprar-ingressos)
- [Baymard: auditoria de atrito no checkout](https://baymard.com/blog/audit-checkout-flow-hidden-friction) e [UX de pagamento](https://baymard.com/learn/payment-ux)
- [UX Collective: exemplos de UX ruim (contador do Eventbrite)](https://uxdesign.cc/examples-of-bad-ux-630492340726)
