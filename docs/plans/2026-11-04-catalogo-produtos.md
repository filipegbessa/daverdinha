# Catálogo de produtos — plano de implementação (site + admin)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Atualizado em 2026-11-04:** a proposta nova do site foi aprovada e muda três coisas neste plano. (1) **URLs aninhadas por categoria**: `/produtos` (todos), `/produtos/[categoria]` (página da categoria, com texto de abertura pro Google) e `/produtos/[categoria]/[produto]` — substitui a rota `/produtos/[slug]` da versão anterior. O produto continua sendo buscado só pelo slug dele (globalmente único); se a categoria da URL não bater com a atual, a página faz `permanentRedirect` (308) pra URL certa. (2) **Contrato novo da API**: `ProductCategory` ganhou `slug`/`description`, o produto traz `category.slug`, e há `GET /product-categories/active` e `GET /products/active?category=` (ver plano irmão no `daverdinha-api`, também atualizado). (3) **Prévia antes do lançamento**: enquanto `SITE_MODE !== 'full'`, as páginas novas ficam acessíveis mas `noindex` e fora do sitemap, e mostram produtos de exemplo rotulados quando a API não devolve nada — pra cliente validar o layout em `/site`.
>
> **Status:** a parte visual (Tarefas 1–7) foi implementada na prévia `/site` com dados de exemplo (`src/features/site/data/samples.ts`), já lendo o contrato novo por `src/features/site/lib/public-api.ts`. O que falta é **ligar na API real** quando o backend for implantado (Tarefa 8 — essencialmente verificação, o código já aponta pros endpoints certos) e as **telas de admin** (Tarefas 9–11). Os nomes de componente citados nas Tarefas 4–7 (`CategoryChips`, `ProductGrid`, `Breadcrumb`) são os do plano — se a implementação da prévia usou outros, vale o código.

**Goal:** substituir a seção "Produtos" vazia da home por um carrossel de verdade, abrir um catálogo completo (`/produtos`), uma página por categoria e uma página por produto, e dar à cliente uma tela de admin pra cadastrar tudo isso sozinha.

**Architecture:** dados vêm do backend novo (`daverdinha-api`, ver `docs/plans/2026-11-04-catalogo-produtos.md` nesse repo — **em produção este plano depende do dele estar implantado antes**, os endpoints abaixo são o contrato já fechado lá). Toda leitura pública passa por `src/features/site/lib/public-api.ts` (`fetchPublic`, que nunca lança — catálogo vazio = `[]`, não erro — mais o fallback de prévia), componentes Server Component recebem os dados prontos, URLs são montadas num lugar só (`src/features/site/lib/paths.ts`), e a tela de admin espelha `/admin/categorias`+`/admin/menu`. O spike visual (`ProductsCarouselSpike.tsx`, já validado com o usuário em `/site`) vira o `Products.tsx` real — mesma posição (entre Sobre e Entrega), mesmo visual, dados de verdade.

**Tech Stack:** Next.js 16 App Router, Server Components para fetch, `permanentRedirect`/`notFound` de `next/navigation`, `apiFetch` existente (`src/features/admin/lib/api-client.ts`, já suporta `FormData`) para o admin.

**Spec:** decisões fechadas com o usuário em 2026-11-04 (preço público, cadastro no admin, com categoria, com `/produtos` além do carrossel, URLs aninhadas por categoria, prévia com exemplos) — resumidas abaixo e no plano irmão do backend. Contrato da API (fonte da verdade pros nomes de campo, já em `src/features/site/types/catalog.ts`):

```ts
// GET /product-categories/active — só categorias ativas com pelo menos um produto ativo, ordenadas por `order`
interface ProductCategory { id: string; name: string; slug: string; description: string }

// GET /products/active[?category=<slug>], GET /products/active/:slug (404 se não existe/inativo)
interface Product {
  id: string; name: string; slug: string; description: string;
  price: number; images: string[];
  category: { id: string; name: string; slug: string };
}
```

## Decisões já tomadas

| # | Decisão |
|---|---|
| 1 | O spike `ProductsCarouselSpike.tsx` fica entre `About` e `DeliveryZones` em `FullSite.tsx` — posição final confirmada visualmente, não muda. |
| 2 | **Revisto em 2026-11-04 pela cliente:** a home mostra só os produtos **em destaque** (`featured` no admin, `GET /products/active?featured=true`), com tags que filtram na própria página e lista que vira carrossel quando passa do que cabe na tela. Os destaques também aparecem nas páginas internas (página de evento). `/produtos` e as páginas de categoria continuam com todos os ativos. |
| 3 | **Rotas aninhadas**: `/produtos`, `/produtos/[categoria]`, `/produtos/[categoria]/[produto]`. Todas renderizadas sob demanda (sem `generateStaticParams`) — mesma filosofia de todo o resto do site, que busca dados no servidor com `revalidate: 60`, nunca pré-renderiza uma lista fixa. A rota antiga `/produtos/[slug]` não existe mais. |
| 4 | **Produto é achado só pelo slug dele.** `/produtos/[categoria]/[produto]` chama `getActiveProductBySlug(produto)` e ignora `categoria` na busca; se `product.category.slug !== categoria`, `permanentRedirect(productHref(product))` (308). Produto que mudou de categoria não quebra link antigo nem duplica conteúdo no Google. |
| 5 | **Categoria sem produto ativo é 404** e fica fora do sitemap — a API já só devolve em `/product-categories/active` categorias com produto ativo; a página da categoria usa essa lista como fonte de verdade. |
| 6 | **Chips de categoria são links de verdade** (`<Link href="/produtos/[categoria]">`), não filtro em JS no cliente — cada categoria tem URL própria, indexável, com `aria-current="page"` no chip da página atual. |
| 7 | **Trilha + dados estruturados**: categoria e produto mostram breadcrumb visível (Início › Produtos › Categoria › Produto) e o JSON-LD correspondente — `CollectionPage` + `BreadcrumbList` na categoria (e em `/produtos`), `Product` (com `offers` em BRL) + `BreadcrumbList` no produto. "Início" aponta pra `homeHref()` (`/site` antes do lançamento). |
| 8 | Preço formatado por **uma** função, `formatPrice` (`src/features/site/lib/format.ts`, `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`) — mesmo locale do resto do site (`pt-BR` no `<html lang>`). |
| 9 | **Prévia antes do lançamento**: com `SITE_MODE !== 'full'`, `/produtos/...` responde, mas com `robots: { index: false, follow: false }` e fora do sitemap; se a API devolve vazio/erro, entram os exemplos de `data/samples.ts` (ids `sample-…`, detectados por `isSample`) com o aviso `PreviewNotice` na página. Em `full`, exemplo **nunca** aparece — vazio é vazio. |
| 10 | Upload de imagem no admin via `<input type="file" multiple>` dentro do mesmo `FormData` que os campos de texto — `apiFetch` já detecta `FormData` e pula o `Content-Type: application/json` (ver `api-client.ts`), nenhuma mudança nele é necessária. |
| 11 | `next.config.ts` **já** libera `*.public.blob.vercel-storage.com` em `images.remotePatterns` — nenhuma mudança de config de imagem é necessária. |

## Global Constraints

- Server Components assíncronos que buscam dado externo **nunca lançam**: todo fetch de catálogo público passa por `fetchPublic` em `lib/public-api.ts` — `try/catch`, `!apiUrl` cedo, devolve `null` em vez de propagar erro (mesmo padrão de `getCoveredDeliveryZones` em `src/features/site/lib/delivery-zones.ts`).
- URL de produto/categoria **só** via `productHref`/`categoryHref` (`lib/paths.ts`) — nenhum componente monta `` `/produtos/${...}` `` na mão; é isso que mantém carrossel, grade, sitemap, JSON-LD e redirect apontando pro mesmo lugar.
- Exemplo só aparece fora de `full` (`withPreviewFallback`); qualquer código novo que leia catálogo usa as funções de `public-api.ts`, nunca `fetch` direto, senão perde essa regra.
- Testes ficam ao lado do arquivo testado (`ComponentName.test.tsx`, `page.test.tsx`).
- `Header` assíncrono já é mockado nos testes de página existentes porque RTL não resolve Server Component async aninhado — qualquer novo teste de página que monte `FullSite` ou o layout do site precisa do mesmo mock.
- `/admin/*` já carrega `X-Robots-Tag: noindex, nofollow` via `next.config.ts` — as rotas novas de admin herdam isso automaticamente, nada a fazer.

## Review Focus

- **Catálogo vazio**: em `full`, home sem produtos não mostra carrossel nem link "ver todos" (`if (items.length === 0) return null`, mesma regra de `DeliveryZones`); `/produtos` com zero produtos mostra uma mensagem, não quebra. Fora de `full`, o mesmo cenário mostra exemplos **com** o aviso de prévia.
- **Redirect, não duplicata**: `/produtos/categoria-errada/vaso-terracota-m` faz 308 pra `/produtos/vasos/vaso-terracota-m` — nunca renderiza o produto sob a URL errada (conteúdo duplicado) nem dá 404.
- **404 de verdade**: produto inexistente/inativo e categoria inexistente/sem produto ativo chamam `notFound()`, não uma página em branco.
- **Exemplo nunca em produção**: com `SITE_MODE=full` e API vazia ou fora do ar, nenhum `sample-…` aparece em página, sitemap ou JSON-LD.
- **SEO da prévia**: fora de `full`, toda página `/produtos/...` tem `noindex` e o sitemap não lista nenhuma delas.
- **Preço no card, na página e no JSON-LD batem**: os três lêem o mesmo `product.price` (`formatPrice` na tela, número cru em `offers.price`) — sem fórmula duplicada que possa divergir.
- **Imagem ausente**: produto cadastrado sem nenhuma foto (admin permite salvar sem imagem) usa o `ImagePlaceholder` existente, igual ao resto do site, em vez de quebrar o `<Image>` do Next com `src` vazio; o JSON-LD `Product` omite `image` nesse caso.
- **CTA do WhatsApp por produto**: a mensagem pré-preenchida tem que incluir o nome exato do produto (`getWhatsAppUrl` já escapa `!`, ver `src/features/site/lib/whatsapp.ts`) — testar que o nome aparece decodificado na URL.

---

## Task 1: Tipos, URLs, formatação e fetch público — ✅ feito (prévia)

**Files:**
- Create: `src/features/site/types/catalog.ts`
- Create: `src/features/site/lib/public-api.ts` (+ `public-api.test.ts`)
- Create: `src/features/site/lib/paths.ts`
- Create: `src/features/site/lib/format.ts` (+ `format.test.ts`)
- Create: `src/features/site/data/samples.ts`

**Interfaces:**
- Produces: `interface ProductCategory`, `interface Product` (campos exatos do contrato acima); `getActiveCategories(): Promise<ProductCategory[]>`, `getActiveProducts(categorySlug?: string): Promise<Product[]>`, `getActiveProductBySlug(slug: string): Promise<Product | null>`; `categoryHref(slug)`, `productHref(product)`, `homeHref()`, `absoluteUrl(path)`; `formatPrice(value)`; `SAMPLE_CATEGORIES`, `SAMPLE_PRODUCTS`, `isSample(item)` — usados por todas as tarefas seguintes.

- [ ] **Step 1: `catalog.ts`** — as interfaces do contrato, copiadas tal e qual da seção "Spec" acima.

- [ ] **Step 2: Testes de `public-api.ts`**, no mesmo molde de `delivery-zones.test.ts`:

```ts
describe('getActiveProducts', () => {
  it('reads active products from the API, cached for a minute', async () => {
    // fetch mockado -> espera chamada em `${apiUrl}/products/active` com { next: { revalidate: 60 } }
  });
  it('passes the category slug as a query param', async () => {
    // getActiveProducts('vasos') -> `${apiUrl}/products/active?category=vasos`
  });
  it('returns [] in full mode when the API errors out', async () => { /* SITE_MODE=full, ok:false -> [] */ });
  it('returns [] in full mode when the API is unreachable', async () => { /* reject -> [] */ });
  it('falls back to sample products before launch when the API returns nothing', async () => {
    // SITE_MODE ausente, [] -> SAMPLE_PRODUCTS (todos com isSample === true)
  });
  it('never mixes samples into real data', async () => { /* API devolve 1 produto -> só ele */ });
});

describe('getActiveCategories', () => {
  it('reads /product-categories/active', async () => { /* ... */ });
});

describe('getActiveProductBySlug', () => {
  it('fetches the product by slug', async () => { /* `${apiUrl}/products/active/${slug}` */ });
  it('returns null on a 404 in full mode', async () => { /* ok:false -> null */ });
  it('finds a sample product by slug before launch', async () => { /* ... */ });
});
```

- [ ] **Step 3: Rodar e confirmar que falha** — `npx jest public-api.test.ts`.
- [ ] **Step 4: Implementar** — `fetchPublic<T>(path)` com a mesma forma de `getCoveredDeliveryZones` (`try/catch`, `if (!apiUrl) return null` cedo) e `withPreviewFallback(items, samples)`: lista não-vazia passa direto; vazia/`null` vira `[]` em `full` e `samples()` fora dele.
- [ ] **Step 5: Rodar e confirmar que passa.**
- [ ] **Step 6: Commit**

```bash
git add src/features/site/types/catalog.ts src/features/site/lib/public-api.ts src/features/site/lib/public-api.test.ts src/features/site/lib/paths.ts src/features/site/lib/format.ts src/features/site/lib/format.test.ts src/features/site/data/samples.ts
git commit -m "feat(site): add catalog types, public fetch helpers and preview samples"
```

---

## Task 2: `Products` — carrossel real, substitui o spike — ✅ feito (prévia)

**Files:**
- Modify: `src/features/site/components/Products.tsx`
- Test: `src/features/site/components/Products.test.tsx` (existente — ajustar aos novos props)
- Modify: `src/features/site/components/FullSite.tsx`
- Delete: `src/features/site/components/ProductsCarouselSpike.tsx`

**Interfaces:**
- Consumes: `Product[]`, `productHref`, `formatPrice` (Tarefa 1).
- Produces: `Products({ products }: { products: Product[] })` — consumido por `FullSite` (Tarefa 3).

Visual: reaproveita exatamente o HTML/classes do spike já validado (`ImagePlaceholder`, `Eyebrow`, cartão `w-64 shrink-0 snap-start`, scroll horizontal `snap-x snap-mandatory`) — troca dado fake por `products`, cada cartão agora é um `<Link href={productHref(product)}>`, mostra `product.images[0]` via `ImagePlaceholder` (`src` omitido quando `images` está vazio — cai no placeholder já existente), nome, preço formatado. "Ver todos os produtos" linka pra `/produtos` e só aparece quando `products.length > 0`.

- [ ] **Step 1: Reescrever os testes de `Products.test.tsx`**

```ts
describe('Products', () => {
  const products = [
    { id: '1', name: 'Vaso Terracota M', slug: 'vaso-terracota-m', description: '', price: 89.9, images: [], category: { id: 'c1', name: 'Vasos', slug: 'vasos' } },
  ];

  it('renders nothing with an empty catalog', () => {
    const { container } = render(<Products products={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a card per product, linking to its nested page', () => {
    render(<Products products={products} />);
    expect(screen.getByRole('link', { name: /Vaso Terracota M/ })).toHaveAttribute('href', '/produtos/vasos/vaso-terracota-m');
  });

  it('formats the price in BRL', () => {
    render(<Products products={products} />);
    expect(screen.getByText('R$ 89,90')).toBeInTheDocument();
  });

  it('links to the full catalog', () => {
    render(<Products products={products} />);
    expect(screen.getByRole('link', { name: 'Ver todos os produtos' })).toHaveAttribute('href', '/produtos');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha.**
- [ ] **Step 3: Implementar `Products.tsx`** — copiar a estrutura do spike, trocando `MOCK_PRODUCTS` por `products: Product[]`, cada card virando `Link`, preço via `formatPrice(product.price)`.
- [ ] **Step 4: Rodar e confirmar que passa.**
- [ ] **Step 5: Trocar `ProductsCarouselSpike` de volta por `Products` em `FullSite.tsx`**, agora recebendo `products` como prop nova (`FullSite({ zones, products }: { zones: DeliveryZone[]; products: Product[] })`), e apagar `ProductsCarouselSpike.tsx`.
- [ ] **Step 6: Rodar a suíte inteira e confirmar que nada mais quebrou** — `npx jest`.
- [ ] **Step 7: Commit**

```bash
git add src/features/site/components/Products.tsx src/features/site/components/Products.test.tsx src/features/site/components/FullSite.tsx
git rm src/features/site/components/ProductsCarouselSpike.tsx
git commit -m "feat(site): wire the real product carousel into FullSite"
```

---

## Task 3: Buscar produtos em `/` e `/site` — ✅ feito (prévia)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/site/page.tsx`
- Modify: `src/app/page.test.tsx`, `src/app/site/page.test.tsx`

**Interfaces:**
- Consumes: `getActiveProducts()` (Tarefa 1), `FullSite({ zones, products })` (Tarefa 2).

- [ ] **Step 1: Ajustar os testes existentes** — mockar `@/features/site/lib/public-api` do mesmo jeito que `@/features/site/lib/delivery-zones` já é mockado em `page.test.tsx`/`site/page.test.tsx`; adicionar ao describe "full site" um teste confirmando que um produto mockado aparece renderizado.

- [ ] **Step 2: `src/app/page.tsx`** — dentro do `mode === 'full'`, buscar `zones` e `products` em paralelo (`Promise.all`) em vez de só `zones`; passar os dois pra `<FullSite zones={zones} products={products} />`. Em modo `'soon'`, nem um nem outro são buscados — mesma regra que já existe pra `zones` (bot/backend fora do ar não pode derrubar a landing).

- [ ] **Step 3: `src/app/site/page.tsx`** — já busca `zones` incondicionalmente; buscar `products` do mesmo jeito, em paralelo. Como `/site` só existe antes do lançamento na prática, aqui os exemplos aparecem quando a API está vazia — é o objetivo da prévia.

- [ ] **Step 4: Rodar os testes e confirmar que passam** — `npx jest src/app/page.test.tsx src/app/site/page.test.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/site/page.tsx src/app/page.test.tsx src/app/site/page.test.tsx
git commit -m "feat(site): fetch active products alongside delivery zones"
```

---

## Task 4: `/produtos` — catálogo completo — ✅ feito (prévia)

**Files:**
- Create: `src/app/produtos/page.tsx`
- Test: `src/app/produtos/page.test.tsx`
- Create: `src/features/site/components/CategoryChips.tsx` (+ `.test.tsx`)
- Create: `src/features/site/components/ProductGrid.tsx` (+ `.test.tsx`)

**Interfaces:**
- Consumes: `getActiveCategories()`, `getActiveProducts()` (Tarefa 1).
- Produces: `CategoryChips({ categories, current?: string })` e `ProductGrid({ products })` — reusados pela Tarefa 5.

- [ ] **Step 1: Testes**

```ts
describe('/produtos', () => {
  it('groups products by category', async () => { /* mock com 2 categorias, confere os 2 <h2> de categoria */ });
  it('renders the category chips as real links', async () => {
    // getByRole('link', { name: 'Vasos' }) -> href '/produtos/vasos'
  });
  it('shows a friendly empty state with zero products', async () => { /* texto "Nenhum produto cadastrado ainda" */ });
  it('each card links to its nested product page', async () => { /* /produtos/vasos/vaso-terracota-m */ });
  it('is noindex before launch', () => { /* generateMetadata().robots.index === false sem SITE_MODE=full */ });
});

describe('CategoryChips', () => {
  it('marks the current category with aria-current="page"', () => { /* ... */ });
});
```

- [ ] **Step 2: Rodar e confirmar que falha.**
- [ ] **Step 3: Implementar** — Server Component assíncrono; busca categorias e produtos em paralelo; chips no topo (`CategoryChips`, cada um um `<Link href={categoryHref(slug)}>`); agrupa `products` por `category.id` na ordem de `categories`; por grupo, um `<h2>` (linkando pra página da categoria) seguido de `ProductGrid` (reaproveita classes de cartão de `Products.tsx`, sem o scroll horizontal — grade normal `grid sm:grid-cols-2 lg:grid-cols-3`). `generateMetadata` com título "Produtos — Daverdinha", `alternates.canonical` e `robots` dependente do modo (ver Tarefa 7). JSON-LD `CollectionPage` + `BreadcrumbList` (Início › Produtos). `PreviewNotice` quando algum item `isSample`.
- [ ] **Step 4: Rodar e confirmar que passa.**
- [ ] **Step 5: Commit**

```bash
git add src/app/produtos/page.tsx src/app/produtos/page.test.tsx src/features/site/components/CategoryChips.tsx src/features/site/components/CategoryChips.test.tsx src/features/site/components/ProductGrid.tsx src/features/site/components/ProductGrid.test.tsx
git commit -m "feat(site): add /produtos catalog page"
```

---

## Task 5: `/produtos/[categoria]` — página da categoria — ✅ feito (prévia)

**Files:**
- Create: `src/app/produtos/[categoria]/page.tsx`
- Test: `src/app/produtos/[categoria]/page.test.tsx`
- Create: `src/features/site/components/Breadcrumb.tsx` (+ `.test.tsx`)

**Interfaces:**
- Consumes: `getActiveCategories()`, `getActiveProducts(categorySlug)` (Tarefa 1), `CategoryChips`, `ProductGrid` (Tarefa 4).
- Produces: `Breadcrumb({ items: { label: string; href?: string }[] })` — reusado pela Tarefa 6; o mesmo array alimenta o JSON-LD `BreadcrumbList`, pra trilha visível e estruturada nunca divergirem.

- [ ] **Step 1: Testes**

```ts
describe('/produtos/[categoria]', () => {
  it('renders the category name as <h1> and its description as intro text', async () => { /* ... */ });
  it('lists only the products of that category', async () => {
    // espera getActiveProducts chamado com 'vasos'
  });
  it('calls notFound() for an unknown category', async () => { /* slug fora de getActiveCategories -> notFound */ });
  it('calls notFound() for a category with no active products', async () => { /* getActiveProducts('vasos') -> [] */ });
  it('highlights the current chip', async () => { /* aria-current no chip 'Vasos' */ });
  it('renders a breadcrumb Início › Produtos › Vasos', async () => { /* ... */ });
  it('emits CollectionPage and BreadcrumbList JSON-LD', async () => {
    // parse do <script type="application/ld+json">: @type CollectionPage com name/description da categoria; BreadcrumbList com 3 itens
  });
  it('uses the category name and description in the metadata', async () => { /* generateMetadata */ });
});
```

- [ ] **Step 2: Rodar e confirmar que falha.**
- [ ] **Step 3: Implementar** — acha a categoria em `getActiveCategories()` pelo `params.categoria`; ausente → `notFound()`; busca `getActiveProducts(categoria.slug)`; vazio → `notFound()` (decisão 5). Layout: `Breadcrumb`, `<h1>{category.name}</h1>`, `<p>{category.description}</p>` (texto de abertura — é o conteúdo que o Google lê), `CategoryChips` com `current`, `ProductGrid`. `generateMetadata`: título `${category.name} — Daverdinha`, `description: category.description`, `alternates.canonical: categoryHref(slug)`, `robots` dependente do modo.
- [ ] **Step 4: Rodar e confirmar que passa.**
- [ ] **Step 5: Commit**

```bash
git add "src/app/produtos/[categoria]" src/features/site/components/Breadcrumb.tsx src/features/site/components/Breadcrumb.test.tsx
git commit -m "feat(site): add category page under /produtos/[categoria]"
```

---

## Task 6: `/produtos/[categoria]/[produto]` — página do produto — ✅ feito (prévia)

**Files:**
- Create: `src/app/produtos/[categoria]/[produto]/page.tsx`
- Test: `src/app/produtos/[categoria]/[produto]/page.test.tsx`

**Interfaces:**
- Consumes: `getActiveProductBySlug(slug)`, `productHref`, `absoluteUrl`, `formatPrice` (Tarefa 1), `Breadcrumb` (Tarefa 5), `getWhatsAppUrl` (`src/features/site/lib/whatsapp.ts`, já existe).

- [ ] **Step 1: Testes**

```ts
describe('/produtos/[categoria]/[produto]', () => {
  it('renders name, formatted price, description and every image', async () => { /* ... */ });
  it('calls notFound() when the product does not exist', async () => { /* getActiveProductBySlug -> null */ });
  it('redirects with 308 when the category in the URL is not the product category', async () => {
    // params { categoria: 'mudas', produto: 'vaso-terracota-m' } -> permanentRedirect('/produtos/vasos/vaso-terracota-m')
  });
  it('looks the product up by its slug only', async () => { /* getActiveProductBySlug chamado com 'vaso-terracota-m', nunca com a categoria */ });
  it('prefills the WhatsApp CTA with the product name', async () => {
    // espera href contendo encodeURIComponent(`Oi! Vim pelo site, tenho interesse em "Vaso Terracota M" 🌱`) com '!' trocado por %21, igual getWhatsAppUrl já faz
  });
  it('emits Product and BreadcrumbList JSON-LD', async () => {
    // Product: name, description, image (omitido sem foto), offers { price: 89.9, priceCurrency: 'BRL', availability: InStock, url absoluta }
    // BreadcrumbList: Início › Produtos › Vasos › Vaso Terracota M
  });
  it('sets the page title to the product name', () => { /* generateMetadata */ });
});
```

- [ ] **Step 2: Rodar e confirmar que falha.**
- [ ] **Step 3: Implementar** — busca `getActiveProductBySlug(params.produto)`; `null` → `notFound()`; `product.category.slug !== params.categoria` → `permanentRedirect(productHref(product))` (decisão 4). `generateMetadata({ params })` devolve `{ title: `${product.name} — Daverdinha`, description: product.description, alternates: { canonical: productHref(product) }, openGraph: { images: [{ url: product.images[0] }] }, robots }` (sem imagem: cai no padrão do `layout.tsx`, não força um campo ausente). Mensagem do CTA: `` `Oi! Vim pelo site, tenho interesse em "${product.name}" 🌱` ``, passada pra `getWhatsAppUrl`; galeria simples (`images.map` com `ImagePlaceholder`/`Image`, grade quando houver mais de uma). Breadcrumb com link pra categoria.
- [ ] **Step 4: Rodar e confirmar que passa.**
- [ ] **Step 5: Commit**

```bash
git add "src/app/produtos/[categoria]/[produto]"
git commit -m "feat(site): add nested product page with category redirect"
```

---

## Task 7: Prévia — `noindex`, sitemap e aviso de exemplo — ✅ feito (prévia)

**Files:**
- Create: `src/features/site/components/PreviewNotice.tsx` (+ `.test.tsx`)
- Modify: `src/app/sitemap.ts`, `src/app/sitemap.test.ts`

**Interfaces:**
- Consumes: `getSiteMode()` (`src/lib/site-mode.ts`), `getActiveCategories()`, `getActiveProducts()`, `isSample`, `categoryHref`, `productHref` (Tarefa 1).

- [ ] **Step 1: Testes**

```ts
describe('sitemap', () => {
  it('lists only the fixed pages before launch', async () => { /* sem SITE_MODE=full: nenhuma URL /produtos */ });
  it('lists /produtos, each category and each product in full mode', async () => {
    // `${siteUrl}/produtos`, `${siteUrl}/produtos/vasos`, `${siteUrl}/produtos/vasos/vaso-terracota-m`
  });
  it('does not break with an empty catalog in full mode', async () => { /* só as entradas fixas */ });
  it('never lists sample items', async () => { /* full + API vazia -> nada de sample- */ });
});

describe('PreviewNotice', () => {
  it('explains that the items shown are examples', () => { /* texto do aviso */ });
});
```

- [ ] **Step 2: Rodar e confirmar que falha.**
- [ ] **Step 3: Implementar**
  - `robots` nas páginas das Tarefas 4–6: `getSiteMode() === 'full' ? undefined : { index: false, follow: false }` — mesmo `robots` que `src/app/site/page.tsx` já usa.
  - `sitemap()` vira `async`; em `full`, busca categorias e produtos em paralelo e acrescenta `/produtos` (`weekly`, 0.7), uma entrada por categoria (`weekly`, 0.6) e uma por produto (`weekly`, 0.6), filtrando `isSample` por garantia. Fora de `full`, só as entradas fixas de hoje.
  - `PreviewNotice`: faixa discreta "Prévia — produtos de exemplo, só pra ver o layout", renderizada pela página quando algum item da tela `isSample`.
- [ ] **Step 4: Rodar e confirmar que passa.**
- [ ] **Step 5: Commit**

```bash
git add src/features/site/components/PreviewNotice.tsx src/features/site/components/PreviewNotice.test.tsx src/app/sitemap.ts src/app/sitemap.test.ts
git commit -m "feat(site): keep catalog pages noindex and out of the sitemap before launch"
```

---

## Task 8: Ligar na API real — ⏳ pendente (depende do backend implantado)

Nenhum código novo esperado: `public-api.ts` já chama os endpoints definitivos. Esta tarefa é a verificação de ponta a ponta quando o plano do backend estiver em produção.

- [ ] **Step 1:** Confirmar contra a API implantada que `GET /product-categories/active`, `GET /products/active`, `GET /products/active?category=<slug>` e `GET /products/active/<slug>` respondem com o shape de `catalog.ts` (em especial `category.slug` e `price` como número).
- [ ] **Step 2:** Cadastrar no admin (Tarefas 10–11) uma categoria e um produto reais; conferir em `/site` que os exemplos somem sozinhos e o aviso de prévia some junto.
- [ ] **Step 3:** Trocar a categoria do produto no admin e conferir que a URL antiga faz 308 pra nova.
- [ ] **Step 4:** Só no lançamento (`SITE_MODE=full` + redeploy): conferir que `/produtos/...` perdeu o `noindex` e que o sitemap passou a listar categorias e produtos.

---

## Task 9: Tipos de admin — ⏳ pendente

**Files:**
- Modify: `src/features/admin/types/admin.ts`

**Interfaces:**
- Produces: `interface ProductCategoryAdmin { id: string; name: string; slug: string; description: string; active: boolean; order: number }`, `interface ProductAdmin { id: string; name: string; slug: string; description: string; price: number; images: string[]; categoryId: string; category: { id: string; name: string; slug: string }; active: boolean; order: number }` — usados pelas Tarefas 10 e 11.

- [ ] **Step 1: Adicionar as duas interfaces a `admin.ts`**, nomes e campos exatamente como acima (espelham `ProductCategoryAdmin`/`ProductAdmin` do plano do backend).
- [ ] **Step 2: `npx tsc --noEmit`** para confirmar que não há erro de tipo.
- [ ] **Step 3: Commit**

```bash
git add src/features/admin/types/admin.ts
git commit -m "feat(admin): add Product and ProductCategory admin types"
```

---

## Task 10: `/admin/categorias-produtos` — CRUD de categoria de produto — ⏳ pendente

**Files:**
- Create: `src/app/admin/categorias-produtos/page.tsx` (+ `.test.tsx`)
- Create: `src/features/admin/components/ProductCategoryDialog.tsx`
- Modify: `src/app/admin/layout.tsx` (`NAV_ITEMS`)

**Interfaces:**
- Consumes: `ProductCategoryAdmin` (Tarefa 9), endpoints `/product-categories` (backend, Tarefa 4 do plano irmão).

Espelha `src/app/admin/categorias/page.tsx` + `CategoryDialog.tsx` quase 1:1 — sem o campo de cor, com `order`, `description` e `active` no lugar.

- [ ] **Step 1: Teste da página** — mesmo molde de `admin/categorias/page.test.tsx` (se existir) ou, na ausência, cobrir: lista renderiza nomes e o endereço (`/produtos/{slug}`) vindos da API, botão "Nova categoria" abre o dialog, excluir chama `DELETE /product-categories/:id` e re-busca a lista, e o 409 de "categoria com produtos" aparece como mensagem, não como erro genérico.
- [ ] **Step 2: Rodar e confirmar que falha.**
- [ ] **Step 3: Implementar `ProductCategoryDialog.tsx`** — campos `name` (texto), `description` (`<textarea>`, com ajuda curta: "Aparece no topo da página da categoria no site"), `order` (número), `active` (`Switch`); `POST`/`PATCH` em `/product-categories` como JSON. `slug` **não** é editável (gerado pelo backend, estável ao renomear) — só exibido, read-only, depois de criado.
- [ ] **Step 4: Implementar a página** — `useApiResource<ProductCategoryAdmin[]>('/product-categories')`, lista simples (sem paginação, decisão do plano do backend), botão criar, editar, excluir com `ConfirmDialog`.
- [ ] **Step 5: Adicionar `{ href: '/admin/categorias-produtos', label: 'Categorias de produto' }` a `NAV_ITEMS`** em `admin/layout.tsx`, logo após `'Categorias'` (rótulo diferente de propósito — evita confundir com a categoria de conversa que já existe ali do lado).
- [ ] **Step 6: Rodar e confirmar que passa.**
- [ ] **Step 7: Commit**

```bash
git add src/app/admin/categorias-produtos src/features/admin/components/ProductCategoryDialog.tsx src/app/admin/layout.tsx
git commit -m "feat(admin): add product category CRUD"
```

---

## Task 11: `/admin/produtos` — CRUD de produto com upload de imagem — ⏳ pendente

**Files:**
- Create: `src/app/admin/produtos/page.tsx` (+ `.test.tsx`)
- Create: `src/features/admin/components/ProductDialog.tsx`
- Modify: `src/app/admin/layout.tsx` (`NAV_ITEMS`)

**Interfaces:**
- Consumes: `ProductAdmin`, `ProductCategoryAdmin` (Tarefa 9), endpoints `/products` (admin) do backend (Tarefa 6 do plano irmão).

- [ ] **Step 1: Teste da página** — lista mostra nome, categoria, preço formatado e um `Switch` de ativo (igual `admin/menu/page.tsx` já faz pra `active`); excluir pede confirmação.
- [ ] **Step 2: Rodar e confirmar que falha.**
- [ ] **Step 3: Implementar `ProductDialog.tsx`**
  - Campos: `name`, `description` (`<textarea>`), `price` (`<Input type="number" step="0.01">`), `categoryId` (`<select>` populado por `useApiResource<ProductCategoryAdmin[]>('/product-categories')`), `order` (número), `active` (`Switch`), imagens (`<input type="file" accept="image/jpeg,image/png,image/webp" multiple>` com preview das miniaturas via `URL.createObjectURL`).
  - Submit monta um `FormData` (texto + arquivos sob a chave `images`) e chama `apiFetch('/products', { method: 'POST', body: formData })` (sem `JSON.stringify` — `apiFetch` já pula o `Content-Type` pra `FormData`, ver Decisão 10).
  - Trocar a categoria de um produto é seguro: a URL antiga redireciona (decisão 4) — não precisa de aviso no dialog.
- [ ] **Step 4: Implementar a página** — espelha `admin/menu/page.tsx` (paginação como `admin/categorias/page.tsx`, já que o catálogo pode crescer mais que categorias).
- [ ] **Step 5: Adicionar `{ href: '/admin/produtos', label: 'Produtos' }` a `NAV_ITEMS`.**
- [ ] **Step 6: Rodar e confirmar que passa.**
- [ ] **Step 7: Commit**

```bash
git add src/app/admin/produtos src/features/admin/components/ProductDialog.tsx src/app/admin/layout.tsx
git commit -m "feat(admin): add product CRUD with image upload"
```

---

## Self-review (feito ao escrever este plano)

- **Cobertura do spec**: carrossel na home (Tarefas 2–3), `/produtos` (Tarefa 4), página de categoria com texto de abertura e chips como links (Tarefa 5), página de produto aninhada com redirect 308 (Tarefa 6), breadcrumb + JSON-LD `CollectionPage`/`Product`/`BreadcrumbList` (Tarefas 4–6), prévia com exemplos, `noindex` e sitemap condicionado ao modo (Tarefas 1 e 7), ligação com a API real (Tarefa 8), cadastro no admin com categoria, descrição e ativo (Tarefas 9–11), preço público formatado (Tarefas 2 e 6) — todas as decisões do usuário têm tarefa.
- **Consistência de tipos**: `Product`/`ProductCategory` (público, Tarefa 1) e `ProductAdmin`/`ProductCategoryAdmin` (admin, Tarefa 9) são definidos uma vez cada e só reaproveitados depois; nenhum componente redefine o shape, e os dois batem com o plano do backend (incluindo `category.slug`).
- **Review Focus**: catálogo vazio (Tarefas 1, 2 e 4), redirect (Tarefa 6), 404 de produto e de categoria (Tarefas 5–6), exemplo nunca em `full` (Tarefas 1 e 7), SEO da prévia (Tarefas 4 e 7), preço consistente (`formatPrice` única), imagem ausente (`ImagePlaceholder` reaproveitado, `image` omitido no JSON-LD), CTA do WhatsApp com nome do produto (Tarefa 6) — todos com teste na tarefa dona.
- **Dependência entre repos**: em produção este plano só faz sentido depois do plano do backend estar implantado — até lá a prévia em `/site` roda com exemplos, e cada tarefa continua testável isoladamente com o fetch mockado, igual ao resto do site já funciona com a API fora do ar.
