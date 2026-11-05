# Loja online V1 — plano de implementação (site + admin)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Atualizado em 2026-11-05 (nomenclatura):** no admin, "Categorias" de conversa viraram **Marcadores** (`/admin/marcadores`) e as categorias de produto viraram **Categorias** (`/admin/categorias`). Código e API mantêm os nomes antigos (`Category`/`/categories` = marcador; `ProductCategory`/`/product-categories` = categoria). As rotas citadas abaixo como `/admin/categorias-produtos` hoje são `/admin/categorias`.

**Goal:** fechar o catálogo (a cliente cadastra categorias e produtos sozinha no admin, e a vitrine que já existe passa a mostrar dados reais) e abrir a venda pelo site: carrinho, checkout com entrega ou retirada, pagamento no Mercado Pago (Checkout Pro, fora do site) e página do pedido; no admin, lista de pedidos e valor do frete por zona.

**Plano irmão:** `daverdinha-api/docs/plans/2026-11-05-loja-online-v1.md` — contratos de API, regras de preço/frete/estoque e webhook. **Os contratos de lá são a fonte da verdade pros nomes de campo** usados aqui.

**Onde estamos:**

| Parte | Situação |
|---|---|
| Vitrine: home (destaques), `/produtos`, `/produtos/[categoria]`, `/produtos/[categoria]/[produto]` | ✅ feito na prévia `/site` (`docs/plans/2026-11-04-catalogo-produtos.md`, Tarefas 1–7), lendo `public-api.ts` |
| API do catálogo | ✅ feita e aplicada na Neon |
| Telas de cadastro no admin | ✅ **Fase 1**, Tarefas 1–3, implementadas em 2026-11-05 (substituem as Tarefas 9–11 do plano do catálogo). Diferença do texto abaixo: a lista de produtos não tem filtro por categoria, porque `GET /products` não filtra e a lista é paginada; fica pra quando o catálogo crescer |
| Ligar a vitrine na API real | ⏳ Fase 1, Tarefa 4 (era a Tarefa 8 do plano do catálogo) |
| Loja V1 | ⏳ **Fase 2** deste plano — depende das Tarefas 1–9 do plano irmão no ar |
| V2 — pagamento dentro do site | fora deste plano (ver "Depois da V1") |

**A Fase 1 não depende de nada novo no backend** e pode ser entregue sozinha: a cliente começa a cadastrar enquanto a loja é construída.

**Architecture:**

- **Admin** (Fase 1 e Tarefa 11): páginas client-side em `src/app/admin/*` no molde de `admin/categorias` e `admin/menu` — `useApiResource` pra ler, `useApiClient().apiFetch` pra escrever (já pula o `Content-Type` com `FormData`), `useApiMutation` pra erro de exclusão, `ConfirmDialog`, `TablePagination`, `Switch`.
- **Carrinho** (Fase 2): estado só no navegador (`localStorage`, chave `daverdinha:cart:v1`), num `CartProvider` client-side montado no `SiteShell`. O carrinho guarda `{ productId, slug, categorySlug, name, price, imageUrl, quantity }` só pra desenhar a tela; **preço e frete que valem são os do `POST /checkout/quote`**, sempre chamado antes de mostrar total e de enviar o pedido.
- **Chamadas da loja** ficam num arquivo só, `src/features/store/lib/store-api.ts` (como `public-api.ts` é pro catálogo): `quoteCart`, `createCheckout`, `getOrderByToken`. As duas primeiras rodam no navegador (precisam do carrinho); `getOrderByToken` roda no servidor (página do pedido).
- **Liga/desliga da loja:** `NEXT_PUBLIC_STORE_ENABLED=true`. Desligada, nada muda no site de hoje (página do produto só com "Pedir pelo WhatsApp", sem ícone de carrinho, `/carrinho`/`/checkout` respondem 404). Assim a loja pode ser lançada depois do site, ou desligada num problema, sem deploy de código.
- Código novo de loja em `src/features/store/` (componentes, lib, types), separado de `src/features/site/` — o site continua funcionando sem ele.

**Tech Stack:** Next.js 16 App Router, React 19, Server Components onde há fetch no servidor, `next/navigation` (`notFound`), Clerk no admin, GA4 (`window.gtag`, já carregado por `src/components/analytics.tsx`).

## Decisões já tomadas

| # | Decisão |
|---|---|
| 1 | **Pagamento por redirect (Checkout Pro).** "Finalizar compra" cria o pedido na API e manda o navegador pra `paymentUrl` (`window.location.assign`). O Mercado Pago devolve pra `/pedido/<token>`. Nada de dado de cartão passa pelo site. |
| 2 | **Rotas novas:** `/carrinho`, `/checkout`, `/pedido/[token]`. Todas `noindex`, fora do sitemap, e `/pedido` também com `robots: nofollow` e sem cache (`dynamic = 'force-dynamic'`) — é por pedido e muda de status. |
| 3 | **WhatsApp continua.** Página do produto ganha "Adicionar ao carrinho" como botão principal e mantém "Pedir pelo WhatsApp" como secundário. Checkout e página do pedido têm "Falar no WhatsApp" com o código do pedido na mensagem. |
| 4 | **Exemplos da prévia não vão pro carrinho.** Produto `sample-…` (`isSample`) mostra o botão desabilitado com "Disponível no lançamento" — senão a cliente testa a prévia e o checkout dá 409. |
| 5 | **Carrinho tolera mudança.** Produto que saiu do ar, esgotou ou mudou de preço aparece na cotação (`problems`/preço novo); a tela de carrinho mostra o aviso na linha, atualiza o preço salvo e bloqueia "Finalizar" até o cliente ajustar. 409 no `POST /checkout` faz o mesmo. |
| 6 | **Entrega:** o cliente escolhe "Entregar" ou "Retirar no ateliê" no checkout. "Entregar" exige CEP; se a cotação disser que não entrega (`delivery.available === false`), a opção fica desabilitada com o motivo e o link pro WhatsApp. |
| 7 | **Carrinho limpo só quando o pedido é criado com sucesso** (resposta 201 do `POST /checkout`), não ao voltar do Mercado Pago — o cliente que desiste do pagamento volta pra `/pedido/<token>`, que tem "Pagar agora" enquanto não vence. |
| 8 | **Destaque no admin.** `featured` (já aceito pela API) é um `Switch` "Mostrar na home" no cadastro de produto e uma coluna na lista. |
| 9 | **Admin de pedidos mostra pagos por padrão** (mesma regra da API); pendentes/vencidos/cancelados atrás do filtro. Status de preparo é um `<select>` (Aguardando → Preparando → Pronto/Saiu pra entrega → Concluído). |
| 10 | **Eventos de GA:** `add_to_cart`, `begin_checkout` e `purchase` (este só na página do pedido, uma vez por pedido, quando o status é `paid`; guardado em `localStorage` pra não contar de novo num F5). Nomes do GA4 de e-commerce, pra o relatório de compras funcionar sem configuração extra. |

**Pra confirmar com a cliente** (afetam texto, não estrutura): endereço e horário de retirada; política de troca/devolução e prazo de entrega (texto das páginas da Tarefa 12); se há peça única (liga o campo "Estoque" na Tarefa 3).

## Global Constraints

- **Checklist do admin** (`CLAUDE.md` → "Admin UI checklist"): lista que cresce é paginada com `usePaginatedResource`; reaproveitar `PageHeader`, `AdminList`, `FormDialog`, `FormField`, `NativeSelect`, `ConfirmDialog` antes de criar componente; toda ação com `Button loading` e lista recarregando com `BusyRegion`. Vale pra todas as telas novas deste plano (pedidos, frete por zona).

- **Nenhum preço é calculado no front pra cobrar.** Total exibido no checkout = o que veio da última cotação. `formatPrice` (`src/features/site/lib/format.ts`) só formata.
- **URL de produto só via `productHref`** (`src/features/site/lib/paths.ts`), inclusive no carrinho e na página do pedido.
- **`localStorage` sempre em `try/catch`** e com leitura validada (formato errado ou versão antiga = carrinho vazio, não tela quebrada). Ler só depois de montar (evita diferença entre HTML do servidor e do navegador): o contador do header começa sem número e aparece após o `useEffect`.
- **Admin herda `noindex`** de `next.config.ts`; páginas novas da loja declaram `robots` no `metadata`.
- **Testes** ao lado do arquivo (`*.test.tsx`), Node 22 pra rodar o jest localmente.
- **Acessibilidade:** botões de quantidade com `aria-label` ("Diminuir quantidade de Vaso M"), total do carrinho em região `aria-live="polite"`, erros de formulário ligados ao campo (`aria-describedby`).

## Review Focus

- **Prévia não vende:** em `/site`, produto de exemplo nunca entra no carrinho.
- **Loja desligada = site de hoje:** com `NEXT_PUBLIC_STORE_ENABLED` ausente, nenhum botão, ícone ou rota nova aparece.
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
- [ ] **Step 5: Implementar** — campos: `name`; `description` (`Textarea`); `price` (`Input type="number" step="0.01" min="0"`); `categoryId` (`<select>` com `useApiResource<ProductCategoryAdmin[]>('/product-categories')`); `order`; `active` (`Switch`, "Aparece no site"); `featured` (`Switch`, "Mostrar na home"); fotos (`ProductImagesInput`); e, quando a Tarefa 4 do plano irmão existir, `stock` (`Input type="number"`, vazio = "Sem controle de estoque").
- [ ] **Step 6: Nav** — `{ href: '/admin/produtos', label: 'Produtos' }` logo antes de `'Categorias de produto'`.
- [ ] **Step 7: Rodar e confirmar que passa.**
- [ ] **Step 8: Commit** — `feat(admin): add product CRUD with photos and featured flag`

---

## Task 4: Ligar a vitrine na API real

Sem código novo esperado — `public-api.ts` já chama os endpoints definitivos. É a verificação de ponta a ponta (a antiga Tarefa 8 do plano do catálogo).

- [ ] **Step 1:** Com a API de produção, conferir que `GET /product-categories/active`, `GET /products/active`, `?category=<slug>`, `?featured=true` e `GET /products/active/<slug>` respondem no formato de `src/features/site/types/catalog.ts` (`price` número, `category.slug`).
- [ ] **Step 2:** Cadastrar pela Tarefa 2/3 uma categoria e dois produtos reais, um em destaque; em `/site`, os exemplos e o aviso de prévia somem e o destaque aparece na home.
- [ ] **Step 3:** Trocar a categoria de um produto e conferir o 308 da URL antiga pra nova.
- [ ] **Step 4:** Só no lançamento (`SITE_MODE=full` + redeploy): `/produtos/...` sem `noindex` e no sitemap.
- [ ] **Step 5:** Marcar as Tarefas 8–11 do plano do catálogo como feitas/substituídas por este plano.

---

# Fase 2 — Loja V1

Pré-requisito: Tarefas 1–9 do plano irmão no ar (pelo menos em homologação, com credenciais de teste do Mercado Pago).

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
- Modify: `src/features/site/types/catalog.ts` (`soldOut?: boolean`, opcional até a Tarefa 4 do plano irmão)

- [ ] **Step 1: Testes do botão** — adiciona e mostra confirmação ("Adicionado · Ver carrinho") por alguns segundos; produto `sample-…` → desabilitado "Disponível no lançamento"; `soldOut` → desabilitado "Esgotado"; dispara `gtag('event', 'add_to_cart', { currency: 'BRL', value, items: [...] })`.
- [ ] **Step 2: Testes do `CartLink`** — sem número antes de `ready`; com itens mostra a contagem e `aria-label="Carrinho, 3 itens"`.
- [ ] **Step 3: Implementar** — na página do produto, `AddToCartButton` vira o botão principal (mesmo estilo do atual) e "Pedir pelo WhatsApp" passa pra botão secundário (contorno), **só com a loja ligada**; com ela desligada a página fica idêntica à de hoje. `CartLink` no header ao lado do menu, e no `MobileNav`.
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

1. **Seus dados** — nome, e-mail ("pra receber o comprovante do Mercado Pago"), WhatsApp (máscara `(21) 99999-9999`).
2. **Entrega** — "Retirar no ateliê" (mostra `pickup.address`) ou "Entregar"; com "Entregar": CEP (recota ao completar 8 dígitos e mostra "Entrega em <bairro>: R$ X"), rua, número, complemento. Entrega indisponível → opção desabilitada com o motivo e link "Falar no WhatsApp".
3. **Resumo** — itens, subtotal, frete, total (da cotação), observações (opcional), aceite "Li a política de trocas" (link da Tarefa 12), botão "Ir para o pagamento".

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
| `pending_payment` | "Aguardando pagamento", prazo (`expiresAt`, "até 14:32"), botão **Pagar agora** (`paymentUrl`), "Já paguei" (recarrega a página — a API reconcilia com o Mercado Pago na leitura) |
| `paid` | "Pedido confirmado!", código `DV-0042`, itens, total, como vai ser a entrega/retirada, status de preparo (`fulfillmentStatus` em texto), "Falar no WhatsApp" com o código |
| `expired` | "O prazo de pagamento acabou", link "Ver produtos" |
| `cancelled` / `refunded` | mensagem curta + WhatsApp |

- [ ] **Step 1: Testes** — token inexistente → `notFound()`; cada linha da tabela; `PurchaseTracker` dispara `purchase` (`transaction_id: code`, `value: total`, `currency: 'BRL'`, `items`) uma vez só por código; a página não mostra rua/número.
- [ ] **Step 2: Rodar e confirmar que falha. Implementar. Rodar e confirmar que passa.**
- [ ] **Step 3: Commit** — `feat(store): add order status page`

---

## Task 11: Admin — pedidos e frete por zona

**Files:**
- Create: `src/app/admin/pedidos/page.tsx` (+ `page.test.tsx`)
- Create: `src/app/admin/pedidos/[id]/page.tsx` (+ `page.test.tsx`)
- Modify: `src/app/admin/entregas/page.tsx` (+ teste) — bloco "Valor da entrega por zona"
- Modify: `src/features/admin/types/admin.ts` — `SiteOrderAdmin`, `DeliveryZoneFee`
- Modify: `src/app/admin/layout.tsx` — `{ href: '/admin/pedidos', label: 'Pedidos' }` logo depois de `'Dashboard'`

**Interfaces:**
- Consumes: rotas `/site-orders` e `/delivery-zone-fees` (plano irmão, Tarefas 3 e 10). O push de pedido novo abre `/admin/pedidos/<id>`.

- [ ] **Step 1: Testes da lista** — padrão mostra pagos; filtro por status (Pagos, Aguardando pagamento, Vencidos, Cancelados, Estornados); colunas código, data, cliente, entrega/retirada, total, preparo; paginação com `TablePagination`; clique abre o detalhe.
- [ ] **Step 2: Testes do detalhe** — dados do cliente com link de WhatsApp (`wa.me`) e endereço completo; itens com link pro produto; troca de preparo via `PATCH`; "Cancelar pedido" com `ConfirmDialog` e, se pago, o texto "O estorno do pagamento é feito no painel do Mercado Pago"; "Atualizar pagamento" chama `POST /site-orders/:id/sync`.
- [ ] **Step 3: Testes do frete** — lista as zonas com o valor (vazio = "Sem entrega"); editar e salvar chama `PUT /delivery-zone-fees/:zone` (zona com espaço: `encodeURIComponent`); valor vazio salva `null`; aviso "Zona sem valor não oferece entrega no site".
- [ ] **Step 4: Rodar e confirmar que falha. Implementar. Rodar e confirmar que passa.**
- [ ] **Step 5: Commit** — `feat(admin): add site orders and delivery fees`

---

## Task 12: Páginas de política, SEO e lançamento

**Files:**
- Create: `src/app/trocas-e-devolucoes/page.tsx` (texto da cliente)
- Modify: `src/app/politica-de-privacidade/page.tsx` — dados coletados na compra (nome, e-mail, telefone, endereço), pra quê e com quem são compartilhados (Mercado Pago)
- Modify: `src/features/site/components/Footer.tsx` — links das políticas
- Modify: `src/app/sitemap.ts` (+ teste) — `/trocas-e-devolucoes` entra; `/carrinho`, `/checkout`, `/pedido` nunca
- Modify: `src/features/site/lib/structured-data.ts` (+ teste) — `offers.availability` `InStock`/`OutOfStock` conforme `soldOut`

- [ ] **Step 1: Testes** — sitemap e JSON-LD como acima.
- [ ] **Step 2: Implementar e rodar.**
- [ ] **Step 3: Homologação ponta a ponta** (Mercado Pago de teste, preview da Vercel com `NEXT_PUBLIC_STORE_ENABLED=true`): comprar com entrega e com retirada; cartão recusado e depois aprovado; Pix que vence; voltar do MP sem pagar e pagar pela página do pedido; produto esgotado no meio da compra; celular (375 px) e desktop; push de pedido novo chegando no admin.
- [ ] **Step 4: Lançamento** — `NEXT_PUBLIC_STORE_ENABLED=true` em produção (depois das variáveis do Mercado Pago de produção na API); marcar `purchase` como evento-chave no GA4; primeira compra real de valor baixo, estornada pelo painel.
- [ ] **Step 5: Commit** — `feat(site): add store policies and launch checks`

---

## Depois da V1 (fora deste plano)

- **V2 — pagamento dentro do site (Checkout Bricks):** a Tarefa 9 deixa de redirecionar e mostra o Brick de pagamento do Mercado Pago no próprio `/checkout`; carrinho, página do pedido e admin não mudam. Estimativa: 16–24 h (somando os dois projetos).
- E-mail próprio, cupom, frete grátis acima de um valor, Correios, boleto.

## Self-review (feito ao escrever este plano)

- **Cobertura:** cadastro (Fase 1, Tarefas 1–3, com `featured` que faltava no plano do catálogo), exibição já feita + verificação (Tarefa 4), V1 completa (Tarefas 5–12), V2 fora.
- **Conferido contra o código:** `NAV_ITEMS` em `admin/layout.tsx`; `apiFetch` pula `Content-Type` com `FormData`; componentes de admin disponíveis (`ConfirmDialog`, `TablePagination`, `StatusMessage`, `Switch`, `Textarea`); `isSample` em `data/samples.ts`; botão "Pedir pelo WhatsApp" atual em `produtos/[categoria]/[produto]/page.tsx`; GA via `window.gtag` (como `ContactLink`).
- **Dependências:** Fase 1 independe do backend novo. Fase 2: 5 → 6 → 7 → 8 → 9 → 10; 11 e 12 em paralelo depois da 5.
