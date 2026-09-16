# daverdinha

Frontend do projeto Daverdinha (Next.js + Tailwind + shadcn/ui + Clerk).

## Setup local

1. `cp .env.local.example .env.local` e preencher as chaves do Clerk (dashboard.clerk.com) e demais variáveis.
2. `npm install`
3. `npm run dev`

Dados do negócio (nome, telefone, endereço) ficam hardcoded em `src/data/business.ts`, não em `.env` — edite ali pra atualizar. As áreas de entrega **não** ficam ali: vêm da API (ver abaixo).

### Áreas de entrega

A seção "Onde entregamos" e o `areaServed` do JSON-LD leem `GET /delivery-locations/covered` da API, com `revalidate` de 60s. A fonte da verdade é o banco — os mesmos `covered` que o bot consulta pra responder um CEP no WhatsApp.

Antes isso era uma lista escrita à mão em `delivery-zones.ts`, transcrita da forma como a dona descreveu a cobertura ("Zona Sul, Centro, Zona Portuária e parte da Zona Norte"). Isso trazia dois problemas: anunciava nomes informais que não são bairros oficiais (`Zona Portuária`, `Cruz Vermelha`, `Lapa`, `Bairro de Fátima`), e continuava anunciando tudo independente do que a dona ligava ou desligava em `/admin/entregas` — o site prometia e o bot negava.

Se a API falhar ou nenhum bairro estiver marcado como atendido, **a seção some** e `areaServed` fica vazio. É proposital: sumir é melhor do que prometer uma área que ninguém confirmou.

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

Página para configurar as 4 mensagens globais do bot:

- **Mensagem de boas-vindas**: enviada assim que a conversa começa.
- **Mensagem de escalonamento**: enviada quando o cliente erra a opção do menu 3 vezes seguidas.
- **Mensagem de conteúdo inválido**: enviada quando o cliente manda áudio, figurinha ou vídeo.
- **Mensagem de pedido pelo catálogo**: enviada quando chega um pedido pelo catálogo do WhatsApp.

Todas as demais mensagens do bot vivem nos itens individuais de menu (um para cada item, e 4 para o item especial de localidades).

### /admin/categorias

Rótulos coloridos que o operador anexa a conversas, pra filtrar a lista em `/admin/conversas`.

A cor é livre: um color picker nativo, sem paleta fixa. O contraste do texto do chip é calculado a partir da cor escolhida (`readable-text-color.ts`), então um tom claro continua legível — antes o texto era branco fixo e sumia.

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

## Listagens e polling

- **`/admin/conversas` e `/admin/categorias`** são paginadas com `<TablePagination>` (setinhas, "Página X de Y" e o total de itens). O controle some quando só existe uma página.
- **`/admin/conversas`** manda busca, "não lidas" e categoria como query params — a filtragem acontece no banco. A busca passa por `use-debounced-value` pra não disparar uma query por tecla.
- **`use-pagination`** cuida dos dois jeitos de um número de página ficar obsoleto: mudar filtro volta pra página 1, e uma página que deixou de existir cai pra última válida.
- **O badge de não-lidas** no menu pede `?perPage=1` e lê `unreadTotal` do envelope. Antes ele baixava a tabela inteira a cada 15s só pra rodar um `.filter()`.
- ⚠️ A lista de conversas ordena por `updatedAt`, que muda a cada mensagem. Da página 2 em diante o poll pode reordenar as linhas sob o operador; a página 1 não sofre. Decisão consciente pra manter os números de página.
- **A thread de mensagens** (`use-conversation-messages`) carrega as últimas 50 junto com a conversa e depois faz **poll delta** (`?since=`): uma conversa parada custa um array vazio, não centenas de mensagens a cada 5s. O botão "Carregar mensagens anteriores" pagina pra trás com `?before=`.
  - O `since` é inclusivo no servidor, então a mensagem da borda volta a cada poll — o merge é por `id` justamente pra descartá-la.

## Convenções do admin

Três peças concentram o que antes cada página reimplementava:

- **`use-api-resource.ts`** — leitura: faz o fetch autenticado e devolve `data` / `isLoading` / `error` / `refetch`, com poll opcional. Toda página de `/admin` lê por aqui.
- **`use-api-mutation.ts`** — escrita: envolve um POST/PATCH/DELETE segurando `isPending` e capturando a falha em `error`. Resolve pra `true`/`false` em vez de lançar, então o chamador decide o que fazer (fechar o diálogo, limpar o form) sem try/catch próprio.
- **`components/StatusMessage.tsx`** e **`components/ConfirmDialog.tsx`** — os estados de carregando/erro e a confirmação antes de excluir. Erro sempre em `text-berry` (da paleta), nunca num `text-red-600` solto.

## Testes

`npm test`

Ver os 3 planos em `docs/superpowers/plans/` (site institucional, admin, e o backend em `daverdinha-api`) pro desenho completo.
