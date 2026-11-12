# Loja online V1 — plano de implementação (site + admin)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Atualizado em 2026-11-05 (nomenclatura):** no admin, "Categorias" de conversa viraram **Marcadores** (`/admin/marcadores`) e as categorias de produto viraram **Categorias** (`/admin/categorias`). Código e API mantêm os nomes antigos (`Category`/`/categories` = marcador; `ProductCategory`/`/product-categories` = categoria). As rotas citadas abaixo como `/admin/categorias-produtos` hoje são `/admin/categorias`.

> **Atualizado em 2026-11-06 (revisão da cliente):** (1) **vai ter estoque** — campo "Estoque" no cadastro de produto entra na Tarefa 11, com um checkbox "Sob encomenda" que desabilita a quantidade (o "soldOut" daqui virou `availability` na revisão de 2026-11-09); (2) **venda de ingresso pros eventos**, em compra separada do carrinho (formulário na página do evento), com nome por participante e inscrição gratuita pelo site — **Fase 3**, Tarefas 13–16. Decisões no plano irmão (decisões 12–18).

> **Atualizado em 2026-11-09 (revisão da cliente):** **pagamento pelo Pagar.me (Stone)** no lugar do Mercado Pago: Pix e cartão à vista ou parcelado sem juros (parcelas configuradas no admin), sem boleto; produto **sob encomenda** com prazo de confecção e selo no site (esgotado continua esgotado); frete por **área de entrega** (subdivisões das zonas, com valor) no lugar do valor por zona; **retirada configurada no admin**; **máximo de ingressos por compra configurável** no cadastro do evento; políticas de troca e de cancelamento de ingresso escritas a partir do questionário `docs/questionario-politicas.md`.

> **Atualizado em 2026-11-09 (escopo do MVP):** **ingressos ficam fora do MVP** — a primeira entrega é só a venda de produtos. A Fase 3 (Tarefas 13–16) fica como desenho pra depois, e a Tarefa 12 lança só com a página de trocas e devoluções.

**Goal:** fechar o catálogo (a cliente cadastra categorias e produtos sozinha no admin, e a vitrine que já existe passa a mostrar dados reais) e abrir a venda pelo site: carrinho, checkout com entrega ou retirada, pagamento no Pagar.me (checkout hospedado, fora do site) e página do pedido; no admin, lista de pedidos, áreas de entrega, retirada, estoque e prazo de encomenda. Depois, venda de ingresso (e inscrição gratuita) na página do evento, com lista de presença no admin.

**Plano irmão:** `daverdinha-api/docs/plans/2026-11-05-loja-online-v1.md` — contratos de API, regras de preço/frete/estoque e webhook. **Os contratos de lá são a fonte da verdade pros nomes de campo** usados aqui.

**Onde estamos:**

| Parte | Situação |
|---|---|
| Vitrine: home (destaques), `/produtos`, `/produtos/[categoria]`, `/produtos/[categoria]/[produto]` | ✅ feito na prévia `/site` (`docs/plans/2026-11-04-catalogo-produtos.md`, Tarefas 1–7), lendo `public-api.ts` |
| API do catálogo | ✅ feita e aplicada na Neon |
| Telas de cadastro no admin | ✅ **Fase 1**, Tarefas 1–3, implementadas em 2026-11-05 (substituem as Tarefas 9–11 do plano do catálogo). Diferença do texto abaixo: a lista de produtos não tem filtro por categoria, porque `GET /products` não filtra e a lista é paginada; fica pra quando o catálogo crescer |
| Ligar a vitrine na API real | ⏳ Fase 1, Tarefa 4 (era a Tarefa 8 do plano do catálogo) |
| Loja V1 — produtos | ⏳ **Fase 2** deste plano — depende das Tarefas 1–9 do plano irmão no ar. Já feitos em 2026-11-09, antecipados: estoque e sob encomenda no cadastro de produto e o selo na vitrine (partes das Tarefas 7 e 11), áreas de entrega em `/admin/entregas` e `/admin/loja` (Tarefa 11, Steps 3, 3b e 3c). Também prontos, sem pagamento: Tarefas 5–10 (carrinho, `/carrinho`, `/checkout`, `/pedido/[token]`) e o admin de pedidos da Tarefa 11. A prévia `/site` roda a loja inteira com os exemplos (decisão 4). Falta o pagamento de verdade (API, Tarefas 6–8) e a Tarefa 12 (políticas, depende do questionário) |
| Agenda — página pública (`/agenda`, `/agenda/[slug]`) | ✅ feita, lendo `src/features/site/types/event.ts` |
| Agenda no admin e ingressos | ⏸️ **Fase 3**, Tarefas 13–16 — fora do MVP (2026-11-09) |
| V2 — pagamento dentro do site | fora deste plano (ver "Depois da V1") |

**A Fase 1 não depende de nada novo no backend** e pode ser entregue sozinha: a cliente começa a cadastrar enquanto a loja é construída.

**Architecture:**

- **Admin** (Fase 1 e Tarefa 11): páginas client-side em `src/app/admin/*` no molde de `admin/categorias` e `admin/menu` — `useApiResource` pra ler, `useApiClient().apiFetch` pra escrever (já pula o `Content-Type` com `FormData`), `useApiMutation` pra erro de exclusão, `ConfirmDialog`, `TablePagination`, `Switch`.
- **Carrinho** (Fase 2): estado só no navegador (`localStorage`, chave `daverdinha:cart:v1`), num `CartProvider` client-side montado no `SiteShell`. O carrinho guarda `{ productId, slug, categorySlug, name, price, imageUrl, quantity }` só pra desenhar a tela; **preço e frete que valem são os do `POST /checkout/quote`**, sempre chamado antes de mostrar total e de enviar o pedido.
- **Chamadas da loja** ficam num arquivo só, `src/features/store/lib/store-api.ts` (como `public-api.ts` é pro catálogo): `quoteCart`, `createCheckout`, `getOrderByToken`. As duas primeiras rodam no navegador (precisam do carrinho); `getOrderByToken` roda no servidor (página do pedido).
- **Liga/desliga da loja:** interruptor "Loja do site" no Dashboard (desde 2026-11-12; antes era `NEXT_PUBLIC_STORE_ENABLED`). Desligada, nada muda no site de hoje (página do produto só com "Pedir pelo WhatsApp", sem ícone de carrinho, `/carrinho`/`/checkout` respondem 404). Assim a loja pode ser lançada depois do site, ou desligada num problema, sem deploy.
- Código novo de loja em `src/features/store/` (componentes, lib, types), separado de `src/features/site/` — o site continua funcionando sem ele.

**Tech Stack:** Next.js 16 App Router, React 19, Server Components onde há fetch no servidor, `next/navigation` (`notFound`), Clerk no admin, GA4 (`window.gtag`, já carregado por `src/components/analytics.tsx`).

## Decisões já tomadas

| # | Decisão |
|---|---|
| 1 | **Pagamento por redirect (checkout hospedado do Pagar.me).** "Finalizar compra" cria o pedido na API e manda o navegador pra `paymentUrl` (`window.location.assign`). O Pagar.me devolve pra `/pedido/<token>`. Pix e cartão (à vista ou parcelado sem juros pro comprador, até o número de parcelas configurado em `/admin/loja`), sem boleto. Nada de dado de cartão passa pelo site. |
| 2 | **Rotas novas:** `/carrinho`, `/checkout`, `/pedido/[token]`. Todas `noindex`, fora do sitemap, e `/pedido` também com `robots: nofollow` e sem cache (`dynamic = 'force-dynamic'`) — é por pedido e muda de status. |
| 3 | **WhatsApp continua.** Página do produto ganha "Adicionar ao carrinho" e, com a loja ligada, perde o "Pedir pelo WhatsApp" (revisto em 2026-11-10: a compra é só pelo carrinho; o WhatsApp segue no cabeçalho e no rodapé). Checkout e página do pedido têm "Falar no WhatsApp" com o código do pedido na mensagem. |
| 4 | **Exemplos da prévia vão pro carrinho, sem chegar à API** (revisto em 2026-11-09, pedido do usuário pra validar a loja em `/site`). Carrinho só com `sample-…` usa uma cotação montada no navegador (`preview-quote.ts`) e finalizar mostra um aviso de prévia em vez de criar pedido. Antes era botão desabilitado com "Disponível no lançamento". |
| 5 | **Carrinho tolera mudança.** Produto que saiu do ar, esgotou ou mudou de preço aparece na cotação (`problems`/preço novo); a tela de carrinho mostra o aviso na linha, atualiza o preço salvo e bloqueia "Finalizar" até o cliente ajustar. 409 no `POST /checkout` faz o mesmo. |
| 6 | **Entrega:** o cliente escolhe "Entregar" ou "Retirar no ateliê" no checkout. "Entregar" exige CEP; se a cotação disser que não entrega (`delivery.available === false`), a opção fica desabilitada com o motivo e o link pro WhatsApp. "Retirar" mostra endereço, horário e instruções configurados no admin e some se a cliente desligar a retirada (`pickup.available === false`). |
| 7 | **Carrinho limpo só quando o pedido é criado com sucesso** (resposta 201 do `POST /checkout`), não ao voltar do Pagar.me — o cliente que desiste do pagamento volta pra `/pedido/<token>`, que tem "Pagar agora" enquanto não vence. |
| 8 | **Destaque no admin.** `featured` (já aceito pela API) é um `Switch` "Mostrar na home" no cadastro de produto e uma coluna na lista. |
| 9 | **Admin de pedidos mostra pagos por padrão** (mesma regra da API); pendentes/vencidos/cancelados atrás do filtro. Status de preparo é um `<select>` (Aguardando → Preparando → Pronto/Saiu pra entrega → Concluído). |
| 10 | **Eventos de GA:** `add_to_cart`, `begin_checkout` e `purchase` (este só na página do pedido, uma vez por pedido, quando o status é `paid`; guardado em `localStorage` pra não contar de novo num F5). Nomes do GA4 de e-commerce, pra o relatório de compras funcionar sem configuração extra. |
| 11 | **Disponibilidade do produto no site** (`ProductPublic.availability`): `in_stock` → selo "Pronta entrega"; `made_to_order` → selo "Sob encomenda" e "Confecção em até N dias" (sem prazo cadastrado: "prazo combinado no WhatsApp"); `sold_out` → "Esgotado", botão de compra desabilitado (o "avise-me" é da V2). O selo aparece no card da listagem, na página do produto, no carrinho e no resumo do checkout. |

**Pendente da conta Stone/Pagar.me da cliente** (esclarecer durante o desenvolvimento, quando ela trouxer as informações): plano, taxas e parcelamento da conta — ver plano irmão, Tarefa 6, Step 0. Até lá valem 3x sem juros e parcela mínima de R$ 30, editáveis em `/admin/loja`.

**Pra confirmar com a cliente:** textos de entrega, retirada e troca/devolução, parcelamento e nota fiscal, a partir das respostas do questionário `docs/questionario-politicas.md` (Tarefa 12). O cancelamento de ingresso fica em `docs/questionario-ingressos.md`, pra quando a Fase 3 entrar.

## Global Constraints

- **Checklist do admin** (`CLAUDE.md` → "Admin UI checklist"): lista que cresce é paginada com `usePaginatedResource`; reaproveitar `PageHeader`, `AdminList`, `FormDialog`, `FormField`, `NativeSelect`, `ConfirmDialog` antes de criar componente; toda ação com `Button loading` e lista recarregando com `BusyRegion`. Vale pra todas as telas novas deste plano (pedidos, áreas de entrega, retirada, agenda, participantes).

- **Nenhum preço é calculado no front pra cobrar.** Total exibido no checkout = o que veio da última cotação. `formatPrice` (`src/features/site/lib/format.ts`) só formata.
- **URL de produto só via `productHref`** (`src/features/site/lib/paths.ts`), inclusive no carrinho e na página do pedido.
- **`localStorage` sempre em `try/catch`** e com leitura validada (formato errado ou versão antiga = carrinho vazio, não tela quebrada). Ler só depois de montar (evita diferença entre HTML do servidor e do navegador): o contador do header começa sem número e aparece após o `useEffect`.
- **Admin herda `noindex`** de `next.config.ts`; páginas novas da loja declaram `robots` no `metadata`.
- **Testes** ao lado do arquivo (`*.test.tsx`), Node 22 pra rodar o jest localmente.
- **Acessibilidade:** botões de quantidade com `aria-label` ("Diminuir quantidade de Vaso M"), total do carrinho em região `aria-live="polite"`, erros de formulário ligados ao campo (`aria-describedby`).

## Review Focus

- **Prévia não vende:** em `/site`, produto de exemplo nunca entra no carrinho.
- **Loja desligada = site de hoje:** com a loja desligada no Dashboard, nenhum botão, ícone ou rota nova aparece.
- **Preço desatualizado:** carrinho salvo ontem com preço antigo mostra o preço novo da cotação e bloqueia "Finalizar" até a nova cotação carregar.
- **Pagamento sem limpar carrinho errado:** falha no `POST /checkout` (409/422/503) mantém o carrinho; sucesso limpa.
- **Página do pedido:** token inválido → 404; pendente → "Pagar agora" + aviso de prazo; pago → confirmação; vencido → mensagem + "Montar o carrinho de novo"; nada de endereço completo na tela.
- **Upload no admin:** salvar produto sem trocar as fotos **não** reenvia o campo `images` (a API substitui todas as fotos quando recebe o campo).

---

# Fase 1 — Cadastro do catálogo no admin

## Task 1: Tipos de admin

**Files:**
- Modify: `src/features/admin/types/admin.ts`

**Interfaces:**
- Produces (espelham `ProductCategoryAdmin`/`ProductAdmin` da API — conferir em `daverdinha-api/src/product-categories/product-categories.service.ts` e `src/products/products.service.ts`):

```ts
export interface ProductCategoryAdmin {
  id: string; name: string; slug: string; description: string;
  active: boolean; order: number;
  productCount: number;           // `_count.products` da API
}

export interface ProductAdmin {
  id: string; name: string; slug: string; description: string;
  price: number; images: string[];
  categoryId: string; category: { id: string; name: string; slug: string };
  active: boolean; featured: boolean; order: number;
  stock?: number | null;          // só depois da Tarefa 4 do plano irmão
}
```

- [ ] **Step 1:** Ler o retorno real de `GET /product-categories` e `GET /products` (local, com token do Clerk, ou pelo `/docs`) e ajustar os nomes acima se a API devolver diferente (em especial a contagem de produtos e se a lista de produtos é paginada).
- [ ] **Step 2:** Adicionar os tipos; `npx tsc --noEmit`.
- [ ] **Step 3: Commit** — `feat(admin): add product catalog admin types`

---

## Task 2: `/admin/categorias-produtos`

**Files:**
- Create: `src/app/admin/categorias-produtos/page.tsx` (+ `page.test.tsx`)
- Create: `src/features/admin/components/ProductCategoryDialog.tsx` (+ `.test.tsx`)
- Modify: `src/app/admin/layout.tsx` (`NAV_ITEMS`) (+ `layout.test.tsx` se ele conta os itens)

**Interfaces:**
- Consumes: `ProductCategoryAdmin` (Tarefa 1); `GET/POST /product-categories`, `PATCH/DELETE /product-categories/:id`.

Espelha `admin/categorias/page.tsx` + `CategoryDialog.tsx` — sem cor, com descrição, ordem e ativo.

- [ ] **Step 1: Testes da página** — lista nome, endereço (`/produtos/<slug>`), contagem de produtos e "Inativa" quando `active: false`; "Nova categoria" abre o dialog; excluir pede confirmação e chama `DELETE`; o 409 da API ("Não é possível excluir uma categoria com produtos cadastrados.") aparece no `ConfirmDialog` como está.
- [ ] **Step 2: Testes do dialog** — cria com `POST` JSON; edita com `PATCH`; slug aparece só leitura na edição, com a ajuda "O endereço não muda ao renomear"; nome vazio não envia.
- [ ] **Step 3: Rodar e confirmar que falha.**
- [ ] **Step 4: Implementar** — campos `name`, `description` (`Textarea`, ajuda: "Aparece no topo da página da categoria no site e ajuda no Google"), `order` (número, ajuda: "Menor aparece primeiro"), `active` (`Switch`).
- [ ] **Step 5: Nav** — `{ href: '/admin/categorias-produtos', label: 'Categorias de produto' }` logo depois de `'Categorias'` (rótulo diferente de propósito: a outra é categoria de conversa).
- [ ] **Step 6: Rodar e confirmar que passa.**
- [ ] **Step 7: Commit** — `feat(admin): add product category CRUD`

---

## Task 3: `/admin/produtos` — cadastro com fotos e destaque

**Files:**
- Create: `src/app/admin/produtos/page.tsx` (+ `page.test.tsx`)
- Create: `src/features/admin/components/ProductDialog.tsx` (+ `.test.tsx`)
- Create: `src/features/admin/components/ProductImagesInput.tsx` (+ `.test.tsx`)
- Modify: `src/app/admin/layout.tsx` (`NAV_ITEMS`)

**Interfaces:**
- Consumes: `ProductAdmin`, `ProductCategoryAdmin` (Tarefa 1); `GET/POST /products`, `PATCH/DELETE /products/:id` (multipart, campo `images`, até 6 fotos de 5 MB, JPEG/PNG/WebP).

- [ ] **Step 1: Testes da página** — lista com miniatura (primeira foto ou `ImagePlaceholder`), nome, categoria, preço (`formatCurrency` de `features/admin/lib/format-currency.ts`), selo "Destaque" e `Switch` de ativo (troca com `PATCH` multipart só com `active`, como o `menu` faz); filtro por categoria (`<select>`); excluir com confirmação; paginação se a API paginar.
- [ ] **Step 2: Testes do `ProductImagesInput`** — escolher arquivos mostra miniaturas (`URL.createObjectURL`, revogadas ao desmontar); mais de 6 → mensagem e não aceita; arquivo > 5 MB ou de outro tipo → mensagem por arquivo; na edição mostra as fotos atuais com o aviso "Escolher novas fotos substitui as atuais".
- [ ] **Step 3: Testes do dialog** — cria com `FormData` (`name`, `description`, `price`, `categoryId`, `order`, `active`, `featured`, `images[]`); **edição sem trocar fotos não envia `images`**; sem categorias cadastradas, mostra "Cadastre uma categoria primeiro" com link pra Tarefa 2 em vez do formulário; erro 400 da API ("Categoria não encontrada.", tipo de arquivo) aparece no dialog.
- [ ] **Step 4: Rodar e confirmar que falha.**
- [ ] **Step 5: Implementar** — campos: `name`; `description` (`Textarea`); `price` (`Input type="number" step="0.01" min="0"`); `categoryId` (`<select>` com `useApiResource<ProductCategoryAdmin[]>('/product-categories')`); `order`; `active` (`Switch`, "Aparece no site"); `featured` (`Switch`, "Mostrar na home"); fotos (`ProductImagesInput`); e, quando a Tarefa 4 do plano irmão existir, `stock` (ver Tarefa 11: quantidade + checkbox "Sob encomenda").
- [ ] **Step 6: Nav** — `{ href: '/admin/produtos', label: 'Produtos' }` logo antes de `'Categorias de produto'`.
- [ ] **Step 7: Rodar e confirmar que passa.**
- [ ] **Step 8: Commit** — `feat(admin): add product CRUD with photos and featured flag`

---

## Task 4: Ligar a vitrine na API real

Sem código novo esperado — `public-api.ts` já chama os endpoints definitivos. É a verificação de ponta a ponta (a antiga Tarefa 8 do plano do catálogo).

- [ ] **Step 1:** Com a API de produção, conferir que `GET /product-categories/active`, `GET /products/active`, `?category=<slug>`, `?featured=true` e `GET /products/active/<slug>` respondem no formato de `src/features/site/types/catalog.ts` (`price` número, `category.slug`).
- [ ] **Step 2:** Cadastrar pela Tarefa 2/3 uma categoria e dois produtos reais, um em destaque; em `/site`, os exemplos e o aviso de prévia somem e o destaque aparece na home.
- [ ] **Step 3:** Trocar a categoria de um produto e conferir o 308 da URL antiga pra nova.
- [ ] **Step 4:** Só no lançamento (interruptor "Site completo" ligado no Dashboard): `/produtos/...` sem `noindex` e no sitemap.
- [ ] **Step 5:** Marcar as Tarefas 8–11 do plano do catálogo como feitas/substituídas por este plano.

---

# Fase 2 — Loja V1

Pré-requisito: Tarefas 1–9 do plano irmão no ar (pelo menos em homologação, com o sandbox do Pagar.me).

## Task 5: Tipos e `store-api.ts`

**Files:**
- Create: `src/features/store/types/store.ts`
- Create: `src/features/store/lib/store-api.ts` (+ `.test.ts`)
- Create: `src/features/store/lib/store-enabled.ts` (`isStoreEnabled()`)

**Interfaces:**
- Produces: `CheckoutQuote`, `CreateCheckoutInput`, `PublicSiteOrder` (cópia fiel do bloco "Contratos" do plano irmão); `quoteCart(items, cep?)`, `createCheckout(input)` → `{ ok: true; code; token; paymentUrl } | { ok: false; status: 409 | 422 | 503 | number; message; problems?; reason? }` (não lança — a tela decide o que mostrar), `getOrderByToken(token)` → `PublicSiteOrder | null` (server-side, `cache: 'no-store'`).

- [ ] **Step 1: Testes** — `createCheckout` devolve `ok: false` com `problems` num 409 e com `reason` num 422; erro de rede vira `{ ok: false, status: 0 }`; `getOrderByToken` devolve `null` em 404 e em falha.
- [ ] **Step 2: Rodar e confirmar que falha. Implementar. Rodar e confirmar que passa.**
- [ ] **Step 3: Commit** — `feat(store): add store API client and types`

---

## Task 6: Carrinho — `CartProvider` e `useCart`

**Files:**
- Create: `src/features/store/lib/cart-storage.ts` (+ `.test.ts`) — ler/gravar/validar o `localStorage`
- Create: `src/features/store/components/CartProvider.tsx` (+ `.test.tsx`)
- Modify: `src/features/site/components/SiteShell.tsx` (envolve com `CartProvider` só se `isStoreEnabled()`)

**Interfaces:**
- Produces: `useCart(): { items: CartItem[]; count: number; ready: boolean; add(product: Product, qty?: number); setQuantity(productId, qty); remove(productId); clear(); syncFromQuote(quote: CheckoutQuote) }`.

- [ ] **Step 1: Testes do storage** — JSON inválido, versão diferente ou item sem `productId` → carrinho vazio; quantidade limitada a 1–20; no máximo 30 itens; `localStorage` que lança (Safari privado) não quebra.
- [ ] **Step 2: Testes do provider** — `add` do mesmo produto soma; `setQuantity(0)` remove; `syncFromQuote` atualiza preço/nome dos itens que voltaram e não remove os com problema (o usuário decide); mudança em outra aba (evento `storage`) atualiza o carrinho; `ready` só vira `true` depois de ler o storage.
- [ ] **Step 3: Rodar e confirmar que falha. Implementar. Rodar e confirmar que passa.**
- [ ] **Step 4: Commit** — `feat(store): add client-side cart`

---

## Task 7: Botão de comprar e ícone do carrinho

**Files:**
- Create: `src/features/store/components/AddToCartButton.tsx` (+ `.test.tsx`)
- Create: `src/features/store/components/CartLink.tsx` (+ `.test.tsx`)
- Modify: `src/app/produtos/[categoria]/[produto]/page.tsx`
- Modify: `src/features/site/components/Header.tsx`, `MobileNav.tsx`
- Modify: `src/features/site/types/catalog.ts` (`availability` e `leadTimeDays`, da Tarefa 4 do plano irmão; os exemplos de `samples.ts` ganham valores variados pra prévia mostrar os três selos)
- Create: `src/features/site/components/AvailabilityBadge.tsx` (+ `.test.tsx`) — selo da decisão 11, usado no `ProductCard`, na página do produto, no carrinho e no checkout

- [ ] **Step 0b: Parcelas na página do produto** — com a loja ligada, abaixo do preço: "ou em até 3x de R$ 33,30 sem juros", calculado com `GET /store-settings/public` (`installmentsFor` do plano irmão, copiado em `src/features/store/lib/installments.ts` com o mesmo teste); 1 parcela possível → não mostra nada. Falha ao buscar → não mostra (nunca quebra a página).
- [ ] **Step 0: Testes do selo** — "Pronta entrega"; "Sob encomenda" + "Confecção em até 10 dias"; sob encomenda sem prazo → "prazo combinado no WhatsApp"; "Esgotado". Aparece mesmo com a loja desligada (é informação do catálogo).
- [ ] **Step 1: Testes do botão** — adiciona e mostra confirmação ("Adicionado · Ver carrinho") por alguns segundos; produto `sample-…` → desabilitado "Disponível no lançamento"; `availability: 'sold_out'` → desabilitado "Esgotado"; dispara `gtag('event', 'add_to_cart', { currency: 'BRL', value, items: [...] })`.
- [ ] **Step 2: Testes do `CartLink`** — sem número antes de `ready`; com itens mostra a contagem e `aria-label="Carrinho, 3 itens"`.
- [ ] **Step 3: Implementar** — na página do produto, `AddToCartButton` vira o botão principal (mesmo estilo do atual) e "Pedir pelo WhatsApp" sai da página (revisto em 2026-11-10), **só com a loja ligada**; com ela desligada a página fica idêntica à de hoje. `CartLink` no header ao lado do menu, e no `MobileNav`.
- [ ] **Step 4: Rodar e confirmar que passa; conferir em 375 px que o header não estoura.**
- [ ] **Step 5: Commit** — `feat(store): add to cart from the product page`

---

## Task 8: `/carrinho`

**Files:**
- Create: `src/app/carrinho/page.tsx` (server: `metadata` noindex, `notFound()` se a loja está desligada) + `src/features/store/components/CartView.tsx` (client) (+ `.test.tsx`)

- [ ] **Step 1: Testes** — carrinho vazio → mensagem + link pra `/produtos`; com itens chama `quoteCart` e mostra preço da cotação, subtotal e "Frete calculado no próximo passo"; `problems` aparecem na linha ("Esgotado", "Só restam 2", "Não está mais disponível") e desabilitam "Finalizar compra"; mudar quantidade recota (com debounce, `use-debounced-value.ts` já existe no admin — mover pra `src/lib/` se for reaproveitar); remover item; "Finalizar compra" leva a `/checkout` e dispara `begin_checkout`.
- [ ] **Step 2: Rodar e confirmar que falha. Implementar** (dentro do `SiteShell`, layout em uma coluna no celular e duas no desktop: itens | resumo). **Rodar e confirmar que passa.**
- [ ] **Step 3: Commit** — `feat(store): add cart page`

---

## Task 9: `/checkout`

**Files:**
- Create: `src/app/checkout/page.tsx` (server: noindex, `notFound()` com loja desligada) + `src/features/store/components/CheckoutForm.tsx` (client) (+ `.test.tsx`)

Formulário em três blocos, numa página só:

1. **Seus dados** — nome, e-mail ("pra receber o comprovante do pagamento"), WhatsApp (máscara `(21) 99999-9999`).
2. **Entrega** — "Retirar no ateliê" (mostra `pickup.address`, `pickup.hours` e `pickup.instructions`; some se `pickup.available` é `false`) ou "Entregar"; com "Entregar": CEP (recota ao completar 8 dígitos e mostra "Entrega em <bairro>: R$ X"), rua, número, complemento. Entrega indisponível → opção desabilitada com o motivo e link "Falar no WhatsApp" (`no_area` usa o mesmo texto de `not_covered`: "Ainda não entregamos nesse bairro pelo site").
3. **Resumo** — itens com o selo de disponibilidade (sob encomenda com o prazo de confecção, e um aviso "Seu pedido tem itens sob encomenda: a entrega/retirada acontece depois da confecção, em até N dias", com N = maior prazo do carrinho), subtotal, frete, total (da cotação), "Pix ou cartão em até Nx sem juros" (N = `installments` da cotação, que já considera o frete), observações (opcional), aceite "Li a política de trocas" (link da Tarefa 12), botão "Ir para o pagamento".

- [ ] **Step 1: Testes** — validação no cliente (campos obrigatórios, e-mail, telefone, CEP) com mensagem ligada ao campo; total exibido = o da cotação; envio chama `createCheckout` só com `{ productId, quantity }` dos itens; 201 → `clear()` e `window.location.assign(paymentUrl)`; 409 → `syncFromQuote` + aviso + volta pro carrinho; 422 → aviso no bloco de entrega; 503/erro de rede → mensagem "Não foi possível iniciar o pagamento…" e o botão volta a funcionar; botão fica "Abrindo o pagamento…" e desabilitado durante o envio (sem pedido em dobro com duplo clique); carrinho vazio redireciona pra `/carrinho`.
- [ ] **Step 2: Rodar e confirmar que falha. Implementar. Rodar e confirmar que passa.**
- [ ] **Step 3: Commit** — `feat(store): add checkout form with delivery options`

---

## Task 10: `/pedido/[token]`

**Files:**
- Create: `src/app/pedido/[token]/page.tsx` (+ `page.test.tsx`) — Server Component, `dynamic = 'force-dynamic'`, `robots: { index: false, follow: false }`
- Create: `src/features/store/components/OrderStatus.tsx`, `PurchaseTracker.tsx` (client, só dispara o `purchase` do GA)

**Interfaces:**
- Consumes: `getOrderByToken` (Tarefa 5).

Tela por status (`PublicSiteOrder.status`):

| Status | O que mostra |
|---|---|
| `pending_payment` | "Aguardando pagamento", prazo (`expiresAt`, "até 14:32"), botão **Pagar agora** (`paymentUrl`), "Já paguei" (recarrega a página — a API reconcilia com o Pagar.me na leitura) |
| `paid` | "Pedido confirmado!", código `DV-0042`, itens (com o prazo dos sob encomenda), total, como vai ser a entrega/retirada (na retirada, `pickup.address`, `pickup.hours` e `pickup.instructions`), status de preparo (`fulfillmentStatus` em texto), "Falar no WhatsApp" com o código |
| `expired` | "O prazo de pagamento acabou", link "Ver produtos" |
| `cancelled` / `refunded` | mensagem curta + WhatsApp |

- [ ] **Step 1: Testes** — token inexistente → `notFound()`; cada linha da tabela; `PurchaseTracker` dispara `purchase` (`transaction_id: code`, `value: total`, `currency: 'BRL'`, `items`) uma vez só por código; a página não mostra rua/número.
- [ ] **Step 2: Rodar e confirmar que falha. Implementar. Rodar e confirmar que passa.**
- [ ] **Step 3: Commit** — `feat(store): add order status page`

---

## Task 11: Admin — pedidos, áreas de entrega, retirada e estoque

**Files:**
- Modify: `src/features/admin/components/ProductDialog.tsx` (+ teste) — campo "Estoque" (`Input type="number" min="0"`) com um checkbox **"Sob encomenda"** ao lado. Marcado: o campo de estoque fica desabilitado (e limpo), aparece o campo **"Prazo de confecção (dias)"** (obrigatório, 1–180) e o envio manda `stock=""` + `leadTimeDays`. Desmarcado: o prazo some, a quantidade é obrigatória (0 vale e significa esgotado) e o envio manda `stock` (o `leadTimeDays` salvo fica guardado na API, pra voltar se ela marcar de novo). Abrir um produto com `stock: null` já vem com o checkbox marcado e o prazo preenchido. Só muda a tela; a API e o banco seguem a decisão 6 do plano irmão.
- Modify: `src/app/admin/produtos/page.tsx` (+ teste) — linha mostra "Estoque: N" / "Esgotado" / "Sob encomenda · N dias"
- Create: `src/app/admin/pedidos/page.tsx` (+ `page.test.tsx`)
- Create: `src/app/admin/pedidos/[id]/page.tsx` (+ `page.test.tsx`)
- Modify: `src/app/admin/entregas/page.tsx` (+ teste) — seção "Áreas de entrega" por zona
- Create: `src/features/admin/components/DeliveryAreaDialog.tsx` (+ `.test.tsx`)
- Create: `src/app/admin/loja/page.tsx` (+ `page.test.tsx`) — "Configurações da loja": retirada e parcelamento
- Modify: `src/features/admin/types/admin.ts` — `SiteOrderAdmin`, `DeliveryAreaAdmin`, `StoreSettings`; `ProductAdmin.stock`/`leadTimeDays` deixam de ser opcionais
- Modify: `src/app/admin/layout.tsx` — `{ href: '/admin/pedidos', label: 'Pedidos' }` logo depois de `'Dashboard'` e `{ href: '/admin/loja', label: 'Loja' }` no fim

**Interfaces:**
- Consumes: rotas `/site-orders`, `/delivery-areas` e `/store-settings` (plano irmão, Tarefas 3 e 10). O push de pedido novo abre `/admin/pedidos/<id>`.

- [ ] **Step 1: Testes da lista** — padrão mostra pagos; filtro por status (Pagos, Aguardando pagamento, Vencidos, Cancelados, Estornados); colunas código, data, cliente, entrega/retirada, total, preparo; paginação com `TablePagination`; clique abre o detalhe.
- [ ] **Step 2: Testes do detalhe** — dados do cliente com link de WhatsApp (`wa.me`) e endereço completo; itens com link pro produto; troca de preparo via `PATCH`; "Cancelar pedido" com `ConfirmDialog` e, se pago, o texto "O estorno do pagamento é feito no painel do Pagar.me"; "Atualizar pagamento" chama `POST /site-orders/:id/sync`; itens sob encomenda mostram o prazo do pedido.
- [ ] **Step 3: Testes das áreas de entrega** — em `/admin/entregas`, cada zona mostra suas áreas ("Perto · R$ 15,00 · 6 bairros") e os bairros cobertos sem área com o aviso "Esses bairros não têm entrega pelo site até entrarem numa área"; "Nova área" na zona abre o `DeliveryAreaDialog` (nome, valor, lista de bairros da zona com checkbox e busca por nome); salvar chama `POST`/`PATCH /delivery-areas` e depois `PUT /delivery-areas/:id/locations`; excluir com `ConfirmDialog` ("Os bairros dessa área ficam sem entrega pelo site"); nome repetido na zona mostra o 409 da API no dialog.
- [ ] **Step 3b: Testes do estoque** — criar com quantidade envia `stock`; marcar "Sob encomenda" desabilita a quantidade, mostra o prazo e envia `stock=""` + `leadTimeDays`; sob encomenda sem prazo não envia (mensagem no campo); desmarcar reabilita e exige quantidade; produto com `stock: null` abre com o checkbox marcado e o prazo; a lista mostra "Esgotado" com `stock: 0` e "Sob encomenda · N dias" com `null`.
- [ ] **Step 3c: Testes de `/admin/loja`** — carrega `GET /store-settings`. Bloco **Retirada**: `SwitchField` "Oferecer retirada no ateliê"; endereço, horário (texto livre, ex.: "Seg a sex, 10h às 18h") e instruções (opcional); desligada mostra "O checkout não oferece retirada enquanto estiver desligada". Bloco **Parcelamento no cartão**: "Máximo de parcelas" (`NativeSelect` 1 a 12, 1 = só à vista) e "Valor mínimo da parcela" (R$), com a ajuda "Sem juros pro cliente: a taxa do parcelamento é descontada do valor que você recebe" e um exemplo ao vivo ("Um pedido de R$ 100 pode ser pago em até 3x de R$ 33,33"). Salvar envia `PATCH` com `Button loading`; endereço/horário vazios não salvam.
- [ ] **Step 4: Rodar e confirmar que falha. Implementar. Rodar e confirmar que passa.**
- [ ] **Step 5: Commit** — `feat(admin): add site orders, delivery areas, pickup settings and product stock`

---

## Task 12: Páginas de política, SEO e lançamento

**Files:**
- Create: `src/app/trocas-e-devolucoes/page.tsx` — texto escrito a partir das respostas da cliente ao questionário `docs/questionario-politicas.md` (Parte 3), incluindo o caso de peça sob encomenda, e com uma seção de entrega e retirada (Partes 1 e 2: prazo, dias e horários, ausência, quanto tempo o pedido fica guardado). O prazo de entrega também aparece em uma linha no checkout
- ~~Create: `src/app/cancelamento-de-ingressos/page.tsx`~~ — fora do MVP, vem com a Fase 3 (`docs/questionario-ingressos.md`)
- Modify: `src/app/politica-de-privacidade/page.tsx` — dados coletados na compra (nome, e-mail, telefone, endereço), pra quê e com quem são compartilhados (Pagar.me/Stone)
- Modify: `src/features/site/components/Footer.tsx` — links das políticas
- Modify: `src/app/sitemap.ts` (+ teste) — `/trocas-e-devolucoes` entra; `/carrinho`, `/checkout`, `/pedido` nunca
- Modify: `src/features/site/lib/structured-data.ts` (+ teste) — `offers.availability` conforme `availability`: `InStock`, `MadeToOrder` ou `OutOfStock` (todos valores de `schema.org/ItemAvailability`)

- [ ] **Step 1: Testes** — sitemap e JSON-LD como acima.
- [ ] **Step 2: Implementar e rodar.**
- [ ] **Step 3: Homologação ponta a ponta** (sandbox do Pagar.me, preview da Vercel apontando pra uma API de homologação com a loja ligada): comprar com entrega e com retirada; cartão à vista e parcelado; pedido abaixo da parcela mínima (só à vista); cartão recusado e depois aprovado; Pix que vence; voltar do Pagar.me sem pagar e pagar pela página do pedido; produto esgotado no meio da compra; carrinho com item sob encomenda (selo e prazo do começo ao fim); CEP de bairro sem área; retirada desligada; celular (375 px) e desktop; push de pedido novo chegando no admin.
- [ ] **Step 4: Lançamento** — a cliente cadastra as áreas de entrega e confere a retirada no admin; ligar "Loja do site" no Dashboard de produção (depois das variáveis do Pagar.me de produção na API); marcar `purchase` como evento-chave no GA4; primeira compra real de valor baixo, estornada pelo painel.
  - [ ] trocar o redirecionamento de contato@daverdinha.com.br para o e-mail da cliente
- [ ] **Step 5: Commit** — `feat(site): add store policies and launch checks`

---

# Fase 3 — Ingressos dos eventos

> ⏸️ **Fora do MVP (2026-11-09).** Desenho pronto pra depois da loja de produtos no ar.

Pré-requisito: plano da agenda da API (Tarefas 1–5) e Tarefas 11–13 do plano irmão no ar. A Tarefa 13 só precisa da agenda da API.

Ingresso **não usa o carrinho** (decisão 12 do plano irmão): a página do evento tem o próprio formulário e vai direto pro pagamento. Carrinho, `/checkout` e frete não mudam.

## Task 13: `/admin/agenda` — cadastro de eventos

**Files:**
- Create: `src/app/admin/agenda/page.tsx` (+ `page.test.tsx`)
- Create: `src/features/admin/components/EventDialog.tsx` (+ `.test.tsx`)
- Modify: `src/features/admin/types/admin.ts` — `EventAdmin`
- Modify: `src/app/admin/layout.tsx` — `{ href: '/admin/agenda', label: 'Agenda' }` depois de `'Categorias'`

**Interfaces:**
- Consumes: `GET /events` (paginado), `POST /events`, `PATCH /events/:id`, `DELETE /events/:id` (multipart, uma foto) do plano da agenda; `ticketSales`, `sold`, `reserved` da Tarefa 11 do plano irmão.

- [ ] **Step 1: Testes da lista** — `usePaginatedResource('/events', { q })` com busca por título; linha com data (fuso `America/Sao_Paulo`), "Rascunho"/"Publicado", "Já aconteceu" quando `endsAt` passou e, com venda ligada, "8 de 20 vagas" (`sold` de `spots`) ou "8 inscritos" sem limite; link "Participantes" (Tarefa 16); excluir com `ConfirmDialog` mostrando o 409 da API como está.
- [ ] **Step 2: Testes do dialog** (`FormDialog`) — título, descrição, início/fim (`datetime-local`, convertido de/para UTC), local (vazio = no ateliê), preço (vazio = gratuito), vagas (vazio = sem limite), "Máximo de ingressos por compra" (número, padrão 10, de 1 a 50, só aparece com a venda ligada), foto, link de inscrição externo, `Switch` "Publicado" e `Switch` "Vender ingressos pelo site" (ajuda: "Pago vira 'Comprar ingresso', gratuito vira 'Inscrever-se'. O link de inscrição deixa de ser usado."); campo vazio envia `""` (a API grava `null`); fim antes do início não envia.
- [ ] **Step 3: Rodar e confirmar que falha. Implementar. Rodar e confirmar que passa.**
- [ ] **Step 4: Commit** — `feat(admin): add event agenda CRUD`

---

## Task 14: Comprar ingresso na página do evento

**Files:**
- Modify: `src/features/site/types/event.ts` — `ticketSales`, `maxTicketsPerOrder`, `spotsLeft`, `soldOut` (nos exemplos de `samples.ts`: `false`/`10`/`null`/`false`)
- Modify: `src/features/store/types/store.ts`, `src/features/store/lib/store-api.ts` (+ teste) — `createTicketCheckout(input)` com o mesmo formato de retorno de `createCheckout` (`paymentUrl: string | null`; 409 com `reason`/`spotsLeft`)
- Create: `src/features/store/components/TicketForm.tsx` (+ `.test.tsx`)
- Modify: `src/app/agenda/[slug]/page.tsx` (+ teste), `src/features/site/components/EventCard.tsx` (+ teste)

O formulário aparece **só** com a loja ligada, `ticketSales: true` e o evento ainda não começado; nos outros casos a página fica como hoje (`ctaUrl` ou WhatsApp). Esgotado → botão desabilitado "Esgotado" + "Falar no WhatsApp" pra lista de espera.

Blocos: **Participantes** (um campo de nome por ingresso, começa com 1, "+ Adicionar participante" até `maxTicketsPerOrder` do evento ou até `spotsLeft`, o que for menor, com o aviso "Máximo de N ingressos por compra"; remover), **Seus dados** (nome, e-mail, WhatsApp, como no checkout), **Resumo** ("2 × R$ 45,00 = R$ 90,00" ou "Gratuito", aceite da política de cancelamento com link pra `/cancelamento-de-ingressos`), botão "Ir para o pagamento" / "Confirmar inscrição".

- [ ] **Step 1: Testes** — não aparece com loja desligada, `ticketSales: false` ou evento começado; `soldOut` → "Esgotado"; não deixa adicionar além de `spotsLeft`/`maxTicketsPerOrder`; 409 `too_many` → "O máximo por compra é N ingressos"; nomes vazios bloqueiam o envio com mensagem no campo; envio manda só `{ eventId, attendees, customer, notes }`; pago → `window.location.assign(paymentUrl)`; gratuito (`paymentUrl: null`) → `router.push('/pedido/<token>')`; 409 `sold_out` → "Restam N vagas" e ajusta o limite; 409 `not_available` → "As vendas desse evento foram encerradas"; 503/rede → mensagem e o botão volta; botão com `loading` durante o envio; dispara `begin_checkout` com o evento como item. `EventCard` mostra "Esgotado" quando `soldOut`.
- [ ] **Step 2: Rodar e confirmar que falha. Implementar. Rodar e confirmar que passa.** Conferir em 375 px.
- [ ] **Step 3: Commit** — `feat(store): buy event tickets from the event page`

---

## Task 15: `/pedido/[token]` com ingresso

**Files:**
- Modify: `src/features/store/components/OrderStatus.tsx` (+ teste), `PurchaseTracker.tsx` (+ teste)

Com `kind: 'tickets'`: em vez de itens e entrega, mostra o evento (título com link pra `/agenda/<slug>`, data, local) e a lista de participantes. `paid` com total 0 → "Inscrição confirmada!"; `paid` com valor → "Ingresso confirmado!". Os dois com "Apresente esta página ou diga o nome na entrada". Sem status de preparo. `expired` → "O prazo de pagamento acabou" + link pro evento.

- [ ] **Step 1: Testes** — cada caso acima; `purchase` do GA só quando `total > 0`, e inscrição gratuita dispara `generate_lead` (evento recomendado do GA4 pra cadastro sem valor), uma vez por código; a página não mostra e-mail nem telefone.
- [ ] **Step 2: Rodar e confirmar que falha. Implementar. Rodar e confirmar que passa.**
- [ ] **Step 3: Commit** — `feat(store): show tickets on the order page`

---

## Task 16: Admin — participantes e pedidos de ingresso

**Files:**
- Create: `src/app/admin/agenda/[id]/participantes/page.tsx` (+ `page.test.tsx`)
- Modify: `src/app/admin/pedidos/page.tsx`, `src/app/admin/pedidos/[id]/page.tsx` (+ testes)
- Modify: `src/features/admin/types/admin.ts` — `Attendee`, `SiteOrderAdmin` com `kind`/`event`/`tickets`

- [ ] **Step 1: Testes dos participantes** — `usePaginatedResource('/events/<id>/attendees', { q })`; cabeçalho "Oficina X · 12 de 20 vagas"; linha com participante, comprador, código do pedido (link pro detalhe) e `Switch` "Presente" (`PATCH /site-order-tickets/:id/check-in`, desabilitado enquanto salva, lista com `BusyRegion`); busca por nome.
- [ ] **Step 2: Testes dos pedidos** — filtro "Produtos / Ingressos" (`kind`) ao lado do de status, e busca por código ou nome (`q`); linha de ingresso mostra o evento e "2 ingressos" no lugar de entrega/retirada; detalhe de ingresso mostra participantes e esconde preparo e endereço.
- [ ] **Step 3: Rodar e confirmar que falha. Implementar. Rodar e confirmar que passa.**
- [ ] **Step 4: Commit** — `feat(admin): add event attendees and ticket orders`

---

## Depois da V1 (fora deste plano)

- **V2 — pagamento dentro do site (checkout transparente do Pagar.me):** a Tarefa 9 deixa de redirecionar; o `/checkout` ganha os campos de cartão (tokenizados no navegador com a chave pública `pk_…`) e o QR do Pix na própria página; carrinho, página do pedido e admin não mudam. Estimativa: 16–24 h (somando os dois projetos).
- **E-mail próprio** (confirmação, pedido pronto, ingresso) pelo Resend — detalhes no plano irmão, "Depois da V1".
- E-mail próprio, cupom, frete grátis acima de um valor, Correios, boleto.
- **"Avise-me quando chegar"** (pedido da cliente em 2026-11-06, pra V2): na página do produto esgotado, o botão "Esgotado" ganha ao lado um campo de e-mail com "Avise-me quando chegar" e a frase de consentimento; enviado, mostra "Pronto, avisamos você por e-mail". No admin, a lista de produtos mostra "N esperando" nos esgotados. Regras e disparo do aviso no plano irmão ("Depois da V1").

## Self-review (feito ao escrever este plano)

- **Cobertura:** cadastro (Fase 1, Tarefas 1–3, com `featured` que faltava no plano do catálogo), exibição já feita + verificação (Tarefa 4), V1 completa (Tarefas 5–12), V2 fora.
- **Conferido contra o código:** `NAV_ITEMS` em `admin/layout.tsx`; `apiFetch` pula `Content-Type` com `FormData`; componentes de admin disponíveis (`ConfirmDialog`, `TablePagination`, `StatusMessage`, `Switch`, `Textarea`); `isSample` em `data/samples.ts`; botão "Pedir pelo WhatsApp" atual em `produtos/[categoria]/[produto]/page.tsx`; GA via `window.gtag` (como `ContactLink`).
- **Dependências:** Fase 1 independe do backend novo. Fase 2: 5 → 6 → 7 → 8 → 9 → 10; 11 e 12 em paralelo depois da 5. Fase 3: 13 (só precisa da agenda da API) → 14 → 15 → 16; 14–16 depois da Fase 2 (reaproveitam `store-api.ts`, `OrderStatus` e o admin de pedidos).
- **Revisão de 2026-11-06:** estoque no cadastro de produto (Tarefa 11); ingressos em compra separada na página do evento (Fase 3); `/admin/agenda` entrou aqui porque nenhum plano do site cobria o cadastro de eventos.
