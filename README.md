# daverdinha

Frontend do projeto Daverdinha (Next.js + Tailwind + shadcn/ui + Clerk).

## Setup local

1. `cp .env.local.example .env.local` e preencher as chaves do Clerk (dashboard.clerk.com) e demais variáveis.
2. `npm install`
3. `npm run dev`

Dados do negócio (nome, telefone, endereço) ficam hardcoded em `src/data/business.ts`, não em `.env` — edite ali pra atualizar.

## Estrutura

- `/` — site institucional (público, sem login).
- `/politica-de-privacidade` — página pública.
- `/login` — acesso ao admin via Clerk.
- `/admin/*` — sistema de gestão (autenticado): dashboard, mensagens, menu, entregas, conversas.

### /admin/menu

Página para gerenciar os itens de menu do bot:

- **Menu items**: cada item consiste em um tema (topic) e uma resposta (reply). Não há seletor de tipo visível — todos os itens criados pelo proprietário são simples tópico + resposta.
- **Localidades (sistema)**: existe um único item de sistema não-deletável chamado "Locais de entrega" que, em vez de uma resposta simples, expõe 4 mensagens:
  - Pergunta inicial (enviada quando o cliente escolhe esse item)
  - Confirmação de entrega (quando o bairro informado é atendido)
  - Região não atendida (quando o bairro informado não é atendido)
  - Mensagem de bairro não reconhecido (quando o bot não consegue identificar o texto como um bairro)
- Itens podem ser ativados/desativados, reordenados, e editados. Itens não-sistema também podem ser deletados.

### /admin/mensagens

Página para configurar as 2 mensagens globais do bot:

- **Mensagem de boas-vindas**: enviada assim que a conversa começa.
- **Mensagem de escalonamento**: enviada quando o cliente erra a opção do menu 3 vezes seguidas.

Todas as demais mensagens do bot vivem agora nos itens individuais de menu (um para cada item, e 4 para o item especial de localidades).

### /admin/entregas

Página para configurar quais bairros do Rio de Janeiro o bot considera atendidos.

- A lista de bairros é fixa: mostra todos os bairros oficiais do Rio, agrupados por região administrativa, com dados vindos do seed do backend. O admin não pode mais criar, renomear nem excluir um bairro — só ligar/desligar a cobertura.
- Cada bairro tem um toggle individual de atende/não atende. Cada região tem um checkbox de "marcar todos", que fica marcado se todos os bairros da região atendem, desmarcado se nenhum atende, e indeterminado se só parte atende; clicar nele liga ou desliga a região inteira de uma vez.
- Um filtro de status ("Todas"/"Atende"/"Não atende") restringe quais bairros aparecem dentro de cada região — mas o cabeçalho da região continua visível mesmo se o filtro esconder todos os seus bairros.

### /admin/conversas

Lista de conversas com clientes; cada linha abre o detalhe em `/admin/conversas/[id]`.

Na página de detalhe:

- **Nome do contato**: pode ser editado a qualquer momento, independente do status da conversa.
- **Pausar bot**: enquanto a conversa está `bot_active`, esse botão transfere o atendimento para um humano sob demanda.
- **Responder e Reativar bot**: uma vez `paused_human` — seja pelo botão acima, seja pela lógica de escalonamento do próprio bot — a página passa a exibir um formulário de resposta (enviada pela mesma API do WhatsApp Cloud que o bot usa) e o botão "Reativar bot", que devolve a conversa ao bot.
- A página é atualizada automaticamente a cada 5 segundos enquanto estiver aberta.

## Testes

`npm test`

Ver os 3 planos em `docs/superpowers/plans/` (site institucional, admin, e o backend em `daverdinha-api`) pro desenho completo.
