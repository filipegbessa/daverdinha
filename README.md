# daverdinha

Frontend do projeto Daverdinha (Next.js + Tailwind + shadcn/ui + Clerk).

## Setup local

1. `cp .env.local.example .env.local` e preencher as chaves do Clerk (dashboard.clerk.com) e demais variáveis.
2. `npm install`
3. `npm run dev`

Dados do negócio (nome, telefone, endereço) ficam hardcoded em `src/data/business.ts`, não em `.env` — edite ali pra atualizar. As áreas de entrega **não** ficam ali: vêm da API (ver abaixo).

### Site e loja: interruptores no Dashboard

Dois interruptores no Dashboard do admin, ao lado do bot, ligam o site e a loja sem deploy. Ficam nas configurações da loja na API (`store_settings.site_enabled` e `store_enabled`), e o site lê por `GET /store-settings/public` (`src/lib/site-settings.ts`) com cache de 1 minuto: a mudança aparece em até 1 minuto.

- **Site completo** desligado: `/` serve a landing **em breve** (`ComingSoon.tsx`), e o site completo — home, catálogo (`/produtos`), agenda (`/agenda`), entregas, FAQ — fica na prévia **`/site`**, pra cliente validar. Na prévia, lista vazia da API vira produtos e eventos **de exemplo**, com a faixa "Prévia do site", e as páginas são `noindex` e ficam fora do sitemap. Ligado: `/` é o site completo e exemplo nunca aparece (lista vazia esconde a seção).
- **Loja do site**: ver "Loja online" abaixo.

**Falha segura:** com a API fora do ar (ou sem `NEXT_PUBLIC_API_URL`), os dois contam como desligados: `/` volta pra "em breve" e a loja some até a API responder.

A landing é **indexável de propósito**: `robots.ts` segue liberando `/`, o sitemap lista a home e o JSON-LD de `LocalBusiness` continua sendo emitido (com `areaServed: []`), pra quem buscar "Daverdinha" achar o negócio e os contatos.

Os canais de contato são WhatsApp, Instagram e o e-mail `contato@daverdinha.com.br` (mostrado em Localização e no JSON-LD). Hoje esse endereço só redireciona pra caixa pessoal do desenvolvedor; no lançamento o redirecionamento passa pra caixa da cliente.

### Loja online (interruptor "Loja do site")

A loja só aparece com o interruptor ligado no Dashboard (`isStoreEnabled()` no servidor; `useStoreEnabled()` nos componentes de cliente, pelo `StoreEnabledProvider` que o `SiteShell` monta). Desligada, o site fica só com WhatsApp, e `/carrinho`, `/checkout` e `/pedido` respondem 404. A API não deixa ligar sem a chave do Pagar.me e recusa pedido com a loja desligada.

- **Carrinho** (`src/features/store`): fica no `localStorage` (`daverdinha:cart:v1`), num `CartProvider` que o `SiteShell` monta com a loja ligada. Guarda só o necessário pra desenhar a tela; leitura tolerante (JSON inválido, item sem id ou armazenamento bloqueado viram carrinho vazio), quantidade de 1 a 20, até 30 produtos, e acompanha outra aba pelo evento `storage`.
- **Página do produto**: "Adicionar ao carrinho" vira o botão principal e "Pedir pelo WhatsApp" o secundário. Esgotado fica "Esgotado", desabilitado. Produto de exemplo da prévia entra no carrinho com o aviso "Prévia: produto de exemplo": com o carrinho só de exemplos, a cotação é montada no navegador (`preview-quote.ts`: preços dos exemplos, retirada no endereço do ateliê, entrega de R$ 15 pra qualquer CEP, até 3x) e finalizar mostra um aviso em vez de chamar a API. É assim que a cliente valida a loja em `/site` antes de ela existir. Dispara `add_to_cart` no GA.
- **Cabeçalho**: ícone do carrinho com a contagem, que só aparece depois de ler o carrinho salvo.
- **`/carrinho`** (noindex, fora do sitemap): pede a cotação (`POST /checkout/quote`) a cada mudança de produto ou quantidade, com 400 ms de espera. Preço, problemas por item ("Esgotado", "Só restam 2", "Não está mais disponível"), subtotal e parcelas vêm da cotação, nunca do que está salvo no navegador. "Finalizar compra" só libera com a cotação em dia e sem problemas, e dispara `begin_checkout`.
- **`/checkout`** (noindex, fora do sitemap): dados (nome, e-mail, WhatsApp com máscara), entrega ou retirada e resumo, numa página só. A cotação é refeita quando o CEP fica completo e mostra "Entrega em <bairro>: R$ X"; sem entrega pro CEP, a opção avisa o motivo com um link pro WhatsApp e o pedido não sai. A retirada mostra endereço, horário e instruções de `/admin/loja` e some se estiver desligada. O resumo traz itens, prazo dos sob encomenda, frete, total e parcelas. Validação no navegador com as mesmas regras da API (`checkout-form.ts`), mensagem em cada campo. "Ir para o pagamento" chama `POST /checkout` só com ids e quantidades; 201 limpa o carrinho e vai pro pagamento (`redirectToPayment`); 409 recota e manda de volta pro carrinho; 422 aparece no CEP; o resto mantém o carrinho e pede pra tentar de novo. ⚠️ A API ainda não tem `POST /checkout` (depende do Pagar.me), então hoje o envio sempre cai no "tente de novo". O link da política de trocas aponta pra `/trocas-e-devolucoes`, que ainda não existe.
- **`/pedido/[token]`** (noindex/nofollow, sem cache): a página do pedido pelo token secreto do link (`GET /checkout/orders/:token`), por status: aguardando (prazo "até 14:32", "Pagar agora" e "Já paguei", que recarrega a página pra API conferir o pagamento), confirmado (preparo, entrega ou endereço da retirada, prazo dos sob encomenda), vencido, cancelado e estornado; sempre com WhatsApp citando o código. O `purchase` do GA dispara uma vez por pedido pago (`PurchaseTracker`, códigos já contados no `localStorage`). Na prévia, `/pedido/exemplo?status=pending_payment|paid|expired|cancelled|refunded` (e `&entrega=retirada`) mostra um pedido de exemplo em cada estado, sem chamar a API.

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

### /admin/marcadores

Rótulos coloridos ("marcadores") que o operador anexa a conversas, pra filtrar a lista em `/admin/conversas`. No código e na API o recurso continua se chamando `Category` / `/categories`.

A cor é livre: um color picker nativo, sem paleta fixa. O contraste do texto do chip é calculado a partir da cor escolhida (`readable-text-color.ts`), então um tom claro continua legível — antes o texto era branco fixo e sumia.

### /admin/produtos

Cadastro do catálogo que aparece no site (`/produtos`, páginas de categoria e de produto, vitrine da home).

- Nome, descrição, preço (máscara de centavos, sempre com "R$" na frente), categoria, "Aparece no site" e "Destaque". A chave da lista liga e desliga o produto sem abrir o formulário.
- Até 6 fotos (JPEG, PNG ou WebP, 5 MB cada), conferidas no navegador antes do envio; a primeira é a capa. Vai tudo num `multipart/form-data` só. Editar sem escolher fotos novas não manda o campo `images` e mantém as atuais; escolher novas substitui todas (é a regra da API).
- O endereço (`/produtos/[categoria]/[produto]`) é gerado pela API e não muda ao renomear.
- Estoque: com quantidade é pronta entrega (0 = esgotado). O checkbox "Sob encomenda" desliga a quantidade e pede o prazo de confecção (1 a 180 dias); vai como `stock=""` + `leadTimeDays`. Voltando pra pronta entrega, o prazo não é enviado e fica guardado na API. A lista mostra "Estoque: N", "Esgotado" ou "Sob encomenda · N dias", e o site mostra o selo correspondente (`AvailabilityBadge`) no card, na página do produto e no JSON-LD (`InStock`/`MadeToOrder`/`OutOfStock`).
- Busca por nome e filtros de categoria, "aparece no site" e destaque, todos no servidor (`GET /products?q=&categoryId=&active=&featured=`), combináveis e paginados.

### /admin/categorias

Categorias do catálogo (no código, `ProductCategory` / `/product-categories`). Cada uma vira uma página `/produtos/[slug]` no site, com a descrição no topo. A lista mostra se aparece no site, a ordem (quando diferente de 0) e quantos produtos tem, com busca por nome (sem acento/caixa) e filtro de situação feitos no navegador, porque a API devolve todas. Não dá pra excluir categoria com produto: a API recusa e a mensagem aparece na confirmação.

### /admin/entregas

Página para configurar quais bairros do Rio de Janeiro o bot considera atendidos.

- A lista de bairros é fixa: mostra todos os bairros oficiais do Rio, agrupados por região administrativa, com dados vindos do seed do backend. O admin não pode mais criar, renomear nem excluir um bairro — só ligar/desligar a cobertura.
- Cada bairro tem um toggle individual de atende/não atende. Cada região tem um checkbox de "marcar todos", que fica marcado se todos os bairros da região atendem, desmarcado se nenhum atende, e indeterminado se só parte atende; clicar nele liga ou desliga a região inteira de uma vez.
- Um filtro de status ("Todas"/"Atende"/"Não atende") restringe quais bairros aparecem dentro de cada região — mas o cabeçalho da região continua visível mesmo se o filtro esconder todos os seus bairros.
- **Áreas de entrega do site** (no topo da página, `DeliveryAreasSection`): cada região se divide em áreas com nome e valor de entrega (`/delivery-areas`). O diálogo da área tem nome, valor (máscara de centavos) e os bairros da região, com busca; marcar um bairro de outra área move ele, e bairro não atendido aparece marcado como tal. Salvar é `POST`/`PATCH` da área e depois `PUT /delivery-areas/:id/locations` com a lista inteira. Bairros atendidos sem área aparecem num aviso: o site não entrega neles. O bot não usa áreas, só a cobertura.

### /admin/loja

Configurações da loja online (`/store-settings`, linha única na API), num formulário só com um "Salvar":

- **Retirada no ateliê**: ligada/desligada, endereço, horário (texto livre) e instruções opcionais. Endereço e horário não podem ficar vazios; pra tirar a retirada do checkout, desliga.
- **Parcelamento no cartão**: máximo de parcelas (1 = só à vista) e valor mínimo da parcela, sem juros pro comprador. O texto de ajuda mostra ao vivo em quantas parcelas sai um pedido de R$ 100, com a mesma regra da API.

### /admin/pedidos

Pedidos feitos no site (`/site-orders`), não os de catálogo que chegam pelo WhatsApp.

- Lista paginada que abre nos **pagos**; o filtro troca pra aguardando pagamento, vencidos, cancelados ou estornados. Busca no servidor por código (`DV-0042`, `42`) ou nome do comprador. Cada linha: código, cliente, data, entrega (com bairro) ou retirada, preparo e total.
- Detalhe (`/admin/pedidos/[id]`): cliente com link de WhatsApp e e-mail, endereço completo com zona e área, observação, itens (com prazo dos sob encomenda) e totais. Pedido pago tem o `<select>` de preparo (Aguardando → Preparando → Pronto/saiu pra entrega → Concluído). "Cancelar pedido" pede confirmação; em pedido pago o texto avisa que os itens voltam pro estoque e que o estorno é no painel do Pagar.me.

### /admin/conversas

Lista de conversas com clientes; cada linha abre o detalhe em `/admin/conversas/[id]`.

Na página de detalhe:

- **Nome do contato**: pode ser editado a qualquer momento, independente do status da conversa.
- **Pausar bot**: enquanto a conversa está `bot_active`, esse botão transfere o atendimento para um humano sob demanda.
- **Responder e Reativar bot**: uma vez `paused_human` — seja pelo botão acima, seja pela lógica de escalonamento do próprio bot — a página passa a exibir um formulário de resposta (enviada pela mesma API do WhatsApp Cloud que o bot usa) e o botão "Reativar bot", que devolve a conversa ao bot.
- **Fotos**: uma mensagem de imagem (`kind: 'image'`) renderiza a foto (com a legenda, quando o cliente escreveu uma), não o corpo vazio. Ver "Imagens" abaixo. O anexo (📎) no formulário de resposta permite mandar uma foto de volta — com ou sem legenda — na mesma caixa de resposta de texto.
- A página é atualizada automaticamente a cada 5 segundos enquanto estiver aberta.

## Imagens (`MessageImage`, anexo de resposta, aviso de armazenamento)

O cliente manda foto pelo WhatsApp e ela aparece na thread como uma mensagem comum; o operador também pode mandar foto de volta.

- **`MessageImage`** (`src/features/admin/components/`) busca a URL assinada sob demanda (`GET /conversations/:id/messages/:messageId/media`) em vez de recebê-la no payload da thread — ela expira em 5 minutos, e a thread fica em cache no cliente. O `src` do `<img>` aponta pro R2 direto, nunca pra API: uma tag `<img>` não manda header de `Authorization`, então a rota da API devolve `{ url }` em JSON, e quem busca esse JSON é o `apiFetch` (que leva o token) — a URL em si dispensa autenticação.
  - **Expiração**: `onError` no `<img>` refaz a busca **uma vez**. Se a segunda URL também falhar, o problema não é expiração — mostra "Não foi possível carregar a imagem" em vez de insistir num laço.
  - **Baixar**: um `<a>` criado e clicado (não `location.assign`, que navegaria a SPA pra fora), apontando pra URL assinada com `?download=1` — o `Content-Disposition: attachment` que a API devolve é quem decide o download, não o atributo `download` do link (ignorado em URL de outra origem).
  - **Compartilhar**: `navigator.share({ files: [file] })` abre a folha nativa do aparelho (Drive, WhatsApp, Fotos, etc.), sem OAuth nem backend próprio. Busca os bytes via `fetch` cross-origin contra o R2 — **depende de CORS no bucket**, configurado restrito à origem do admin. Escondido onde `navigator.canShare` não existe (desktop, Firefox).
- **Anexo na resposta** (`/admin/conversas/[id]`): escolher um arquivo troca o POST de `/conversations/:id/reply` (JSON) para `/conversations/:id/reply-image` (multipart) — a legenda vira o `caption` da imagem, uma mensagem só, não duas. Tipo e tamanho são checados no navegador antes do upload (mesmos limites do backend: JPEG/PNG/WebP, 5 MB), só pra avisar o operador mais cedo — a API decide de verdade. Com anexo, a legenda deixa de ser obrigatória: a imagem já é a mensagem.
- **`StorageUsageNotice`** (Dashboard): acima de 80% do teto de 8 GB de armazenamento (`BotSettings.mediaBytesUsed`, que a API já converte de `bigint` pra `number`), um aviso neutro aparece; no teto, o mesmo tom vermelho do aviso já existente de "bot desativado por falta de item de menu" — mesma classe de problema, um recurso parou. Abaixo de 80%, nada aparece.

## Listagens e polling

- **`/admin/conversas`, `/admin/marcadores` e `/admin/produtos`** são paginadas com `<TablePagination>` (setinhas, "Página X de Y" e o total de itens). O controle some quando só existe uma página.
- **`/admin/conversas`** manda busca, "não lidas" e marcador como query params — a filtragem acontece no banco. A busca passa por `use-debounced-value` pra não disparar uma query por tecla.
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

Planos das features em andamento ficam em `docs/plans/` (o do backend, no `daverdinha-api`).
