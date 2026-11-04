# Catálogo de produtos — plano de implementação (site + admin)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** substituir a seção "Produtos" vazia da home por um carrossel de verdade, abrir uma página por produto e um catálogo completo (`/produtos`), e dar à cliente uma tela de admin pra cadastrar tudo isso sozinha.

**Architecture:** dados vêm do backend novo (`daverdinha-api`, ver `docs/plans/2026-11-04-catalogo-produtos.md` nesse repo — **este plano depende do dele estar implantado antes**, os endpoints abaixo são o contrato já fechado lá). Segue o padrão já usado por zonas de entrega e destaques: um `lib/products.ts` que busca e nunca lança (catálogo vazio = `[]`, não erro), componentes Server Component recebendo os dados prontos, e uma tela de admin espelhando `/admin/categorias`+`/admin/menu`. O spike visual (`ProductsCarouselSpike.tsx`, já validado com o usuário em `/site`) vira o `Products.tsx` real neste plano — mesma posição (entre Sobre e Entrega), mesmo visual, dados de verdade.

**Tech Stack:** Next.js 16 App Router, Server Components para fetch, `apiFetch` existente (`src/features/admin/lib/api-client.ts`, já suporta `FormData`) para o admin.

**Spec:** decisões fechadas com o usuário em 2026-11-04 (preço público, cadastro no admin, com categoria, com `/produtos` além do carrossel) — resumidas abaixo e no plano irmão do backend. Contrato da API (fonte da verdade pros nomes de campo):

```ts
// GET /products/active, GET /products/active/:slug
interface Product {
  id: string; name: string; slug: string; description: string;
  price: number; images: string[];
  category: { id: string; name: string };
}
```

## Decisões já tomadas

| # | Decisão |
|---|---|
| 1 | O spike `ProductsCarouselSpike.tsx` fica entre `About` e `DeliveryZones` em `FullSite.tsx` — posição final confirmada visualmente, não muda. |
| 2 | Carrossel da home mostra **todos** os produtos ativos (sem flag de destaque, decisão espelhada do backend); `/produtos` é o "ver todos" pra quando a lista crescer. |
| 3 | `/produtos/[slug]` é renderizado sob demanda (sem `generateStaticParams`) — mesma filosofia de todo o resto do site, que já busca dados no servidor a cada request com `revalidate: 60`, nunca pré-renderiza uma lista fixa. |
| 4 | Preço formatado com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` — mesmo locale do resto do site (`pt-BR` no `<html lang>`). |
| 5 | Upload de imagem no admin via `<input type="file" multiple>` dentro do mesmo `FormData` que os campos de texto — `apiFetch` já detecta `FormData` e pula o `Content-Type: application/json` (ver `api-client.ts`), nenhuma mudança nele é necessária. |
| 6 | `next.config.ts` **já** libera `*.public.blob.vercel-storage.com` em `images.remotePatterns` — nenhuma mudança de config de imagem é necessária. |

## Global Constraints

- Server Components assíncronos que buscam dado externo **nunca lançam**: todo fetch de catálogo público segue o padrão de `getCoveredDeliveryZones`/`getActiveHeroSlides` — `try/catch`, `!apiUrl` cedo, devolve vazio/`null` em vez de propagar erro (ver `src/features/site/lib/delivery-zones.ts`).
- Testes ficam ao lado do arquivo testado (`ComponentName.test.tsx`, `page.test.tsx`).
- `Header`/`Hero` assíncronos já são mockados nos testes de página existentes porque RTL não resolve Server Component async aninhado — qualquer novo teste de página que monte `FullSite` precisa do mesmo mock.
- `/admin/*` já carrega `X-Robots-Tag: noindex, nofollow` via `next.config.ts` — as rotas novas de admin herdam isso automaticamente, nada a fazer.

## Review Focus

- **Catálogo vazio**: home sem produtos não mostra carrossel nem link "ver todos" (mesma regra que `Products`/`DeliveryZones` já seguem hoje — `if (items.length === 0) return null`); `/produtos` com zero produtos mostra uma mensagem, não quebra.
- **Slug inexistente ou de produto inativo**: `/produtos/algo-que-não-existe` devolve 404 de verdade (`notFound()`), não uma página em branco.
- **Preço no card e na página batem**: os dois lêem o mesmo `product.price` formatado pela mesma função — sem fórmula duplicada que possa divergir.
- **Imagem ausente**: produto cadastrado sem nenhuma foto (admin permite salvar sem imagem) usa o `ImagePlaceholder` existente, igual ao resto do site, em vez de quebrar o `<Image>` do Next com `src` vazio.
- **CTA do WhatsApp por produto**: a mensagem pré-preenchida tem que incluir o nome exato do produto (`getWhatsAppUrl` já escapa `!`, ver `src/features/site/lib/whatsapp.ts`) — testar que o nome aparece decodificado na URL.

---

## Task 1: Tipos e fetch público (`lib/products.ts`)

**Files:**
- Create: `src/features/site/types/product.ts`
- Create: `src/features/site/lib/products.ts`
- Test: `src/features/site/lib/products.test.ts`

**Interfaces:**
- Produces: `interface Product` (campos exatos do contrato acima), `getActiveProducts(): Promise<Product[]>`, `getActiveProductBySlug(slug: string): Promise<Product | null>` — usados pelas Tarefas 2, 3, 5 e 6.

- [ ] **Step 1: `product.ts`** — a interface do contrato, copiada tal e qual da seção "Spec" acima.

- [ ] **Step 2: Testes de `products.ts`**, no mesmo molde de `delivery-zones.test.ts`:

```ts
describe('getActiveProducts', () => {
  it('reads active products from the API, cached for a minute', async () => {
    // fetch mockado -> espera chamada em `${apiUrl}/products/active` com { next: { revalidate: 60 } }
  });
  it('hides the section rather than guessing when the API errors out', async () => { /* ok:false -> [] */ });
  it('hides the section when the API is unreachable', async () => { /* reject -> [] */ });
  it('does not even try when the API URL is not configured', async () => { /* sem NEXT_PUBLIC_API_URL -> [] sem chamar fetch */ });
});

describe('getActiveProductBySlug', () => {
  it('fetches the product by slug', async () => {
    // espera chamada em `${apiUrl}/products/active/${slug}`
  });
  it('returns null on a 404', async () => { /* ok:false -> null */ });
  it('returns null when the API is unreachable', async () => { /* reject -> null */ });
});
```

- [ ] **Step 3: Rodar e confirmar que falha** — `npx jest products.test.ts`.
- [ ] **Step 4: Implementar** — mesma forma exata de `getCoveredDeliveryZones`, incluindo o `try/catch` e o `if (!apiUrl) return [] /* ou null */` cedo.
- [ ] **Step 5: Rodar e confirmar que passa.**
- [ ] **Step 6: Commit**

```bash
git add src/features/site/types/product.ts src/features/site/lib/products.ts src/features/site/lib/products.test.ts
git commit -m "feat(site): add product type and public fetch helpers"
```

---

## Task 2: `Products` — carrossel real, substitui o spike

**Files:**
- Modify: `src/features/site/components/Products.tsx`
- Test: `src/features/site/components/Products.test.tsx` (existente — ajustar aos novos props)
- Modify: `src/features/site/components/FullSite.tsx`
- Delete: `src/features/site/components/ProductsCarouselSpike.tsx`

**Interfaces:**
- Consumes: `Product[]` (Tarefa 1).
- Produces: `Products({ products }: { products: Product[] })` — consumido por `FullSite` (Tarefa 3).

Visual: reaproveita exatamente o HTML/classes do spike já validado (`ImagePlaceholder`, `Eyebrow`, cartão `w-64 shrink-0 snap-start`, scroll horizontal `snap-x snap-mandatory`) — troca dado fake por `products`, cada cartão agora é um `<Link href={`/produtos/${product.slug}`}>`, mostra `product.images[0]` via `ImagePlaceholder` (`src` omitido quando `images` está vazio — cai no placeholder já existente), nome, preço formatado. "Ver todos os produtos" linka pra `/produtos` e só aparece quando `products.length > 0`.

- [ ] **Step 1: Reescrever os testes de `Products.test.tsx`**

```ts
describe('Products', () => {
  const products = [
    { id: '1', name: 'Vaso Terracota M', slug: 'vaso-terracota-m', description: '', price: 89.9, images: [], category: { id: 'c1', name: 'Vasos' } },
  ];

  it('renders nothing with an empty catalog', () => {
    const { container } = render(<Products products={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a card per product, linking to its page', () => {
    render(<Products products={products} />);
    expect(screen.getByRole('link', { name: /Vaso Terracota M/ })).toHaveAttribute('href', '/produtos/vaso-terracota-m');
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
- [ ] **Step 3: Implementar `Products.tsx`** — copiar a estrutura do spike, trocando `MOCK_PRODUCTS` por `products: Product[]`, cada card virando `Link`, preço via `new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)`.
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

## Task 3: Buscar produtos em `/` e `/site`

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/site/page.tsx`
- Modify: `src/app/page.test.tsx`, `src/app/site/page.test.tsx`

**Interfaces:**
- Consumes: `getActiveProducts()` (Tarefa 1), `FullSite({ zones, products })` (Tarefa 2).

- [ ] **Step 1: Ajustar os testes existentes** — mockar `@/features/site/lib/products` do mesmo jeito que `@/features/site/lib/delivery-zones` já é mockado em `page.test.tsx`/`site/page.test.tsx`; adicionar ao describe "full site" um teste confirmando que um produto mockado aparece renderizado.

- [ ] **Step 2: `src/app/page.tsx`** — dentro do `mode === 'full'`, buscar `zones` e `products` em paralelo (`Promise.all`) em vez de só `zones`; passar os dois pra `<FullSite zones={zones} products={products} />`. Em modo `'soon'`, nem um nem outro são buscados — mesma regra que já existe pra `zones` (bot/backend fora do ar não pode derrubar a landing).

- [ ] **Step 3: `src/app/site/page.tsx`** — já busca `zones` incondicionalmente; buscar `products` do mesmo jeito, em paralelo.

- [ ] **Step 4: Rodar os testes e confirmar que passam** — `npx jest src/app/page.test.tsx src/app/site/page.test.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/site/page.tsx src/app/page.test.tsx src/app/site/page.test.tsx
git commit -m "feat(site): fetch active products alongside delivery zones"
```

---

## Task 4: `/produtos` — catálogo completo

**Files:**
- Create: `src/app/produtos/page.tsx`
- Test: `src/app/produtos/page.test.tsx`

**Interfaces:**
- Consumes: `getActiveProducts()` (Tarefa 1).

- [ ] **Step 1: Testes**

```ts
describe('/produtos', () => {
  it('groups products by category', async () => { /* mock com 2 categorias, confere os 2 <h2> de categoria */ });
  it('shows a friendly empty state with zero products', async () => { /* texto "Nenhum produto cadastrado ainda" */ });
  it('each card links to its own product page', async () => { /* ... */ });
});
```

- [ ] **Step 2: Rodar e confirmar que falha.**
- [ ] **Step 3: Implementar** — Server Component assíncrono; agrupa `products` por `category.id` (um `reduce` simples); por grupo, um `<h2>{category.name}</h2>` seguido de uma grade (reaproveita classes de cartão de `Products.tsx`, sem o scroll horizontal — grade normal `grid sm:grid-cols-2 lg:grid-cols-3`); `generateMetadata` com título "Produtos — Daverdinha".
- [ ] **Step 4: Rodar e confirmar que passa.**
- [ ] **Step 5: Commit**

```bash
git add src/app/produtos/page.tsx src/app/produtos/page.test.tsx
git commit -m "feat(site): add /produtos catalog page"
```

---

## Task 5: `/produtos/[slug]` — página do produto

**Files:**
- Create: `src/app/produtos/[slug]/page.tsx`
- Test: `src/app/produtos/[slug]/page.test.tsx`

**Interfaces:**
- Consumes: `getActiveProductBySlug(slug)` (Tarefa 1), `getWhatsAppUrl` (`src/features/site/lib/whatsapp.ts`, já existe).

- [ ] **Step 1: Testes**

```ts
describe('/produtos/[slug]', () => {
  it('renders name, formatted price, description and every image', async () => { /* ... */ });
  it('calls notFound() when the product does not exist', async () => { /* mock getActiveProductBySlug -> null, espera notFound chamado */ });
  it('prefills the WhatsApp CTA with the product name', async () => {
    // espera href contendo encodeURIComponent(`Oi! Vim pelo site, tenho interesse em "Vaso Terracota M" 🌱`) com '!' trocado por %21, igual getWhatsAppUrl já faz
  });
  it('sets the page title to the product name', () => { /* generateMetadata */ });
});
```

- [ ] **Step 2: Rodar e confirmar que falha.**
- [ ] **Step 3: Implementar** — `generateMetadata({ params })` busca o produto e devolve `{ title: `${product.name} — Daverdinha`, description: product.description, openGraph: { images: [{ url: product.images[0] }] } }` (sem imagem: cai no padrão do `layout.tsx`, não força um campo ausente); a página chama `notFound()` do `next/navigation` quando o produto é `null`; mensagem do CTA: `` `Oi! Vim pelo site, tenho interesse em "${product.name}" 🌱` ``, passada pra `getWhatsAppUrl`; galeria simples (`images.map` com `ImagePlaceholder`/`Image`, grade quando houver mais de uma).
- [ ] **Step 4: Rodar e confirmar que passa.**
- [ ] **Step 5: Commit**

```bash
git add "src/app/produtos/[slug]/page.tsx" "src/app/produtos/[slug]/page.test.tsx"
git commit -m "feat(site): add individual product page"
```

---

## Task 6: `sitemap.ts` — incluir `/produtos` e cada produto

**Files:**
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/sitemap.test.ts`

**Interfaces:**
- Consumes: `getActiveProducts()` (Tarefa 1).

- [ ] **Step 1: Ajustar o teste** — mockar `getActiveProducts`, confirmar que o array devolvido inclui `${siteUrl}/produtos` e `${siteUrl}/produtos/${slug}` por produto; confirmar que catálogo vazio não quebra o sitemap (só as entradas fixas).
- [ ] **Step 2: Rodar e confirmar que falha.**
- [ ] **Step 3: Implementar** — `sitemap()` já pode ser `async` em Next.js; busca `getActiveProducts()`, adiciona a entrada fixa de `/produtos` (`changeFrequency: 'weekly', priority: 0.7`) e um `map` com uma entrada por produto (`changeFrequency: 'weekly', priority: 0.6`).
- [ ] **Step 4: Rodar e confirmar que passa.**
- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.ts src/app/sitemap.test.ts
git commit -m "feat(site): list /produtos and each product in the sitemap"
```

---

## Task 7: Tipos de admin + cliente HTTP (sem UI ainda)

**Files:**
- Modify: `src/features/admin/types/admin.ts`

**Interfaces:**
- Produces: `interface ProductCategoryAdmin { id: string; name: string; order: number }`, `interface ProductAdmin { id: string; name: string; slug: string; description: string; price: number; images: string[]; categoryId: string; category: { id: string; name: string }; active: boolean; order: number }` — usados pelas Tarefas 8 e 9.

- [ ] **Step 1: Adicionar as duas interfaces a `admin.ts`**, nomes e campos exatamente como acima (espelham o `ProductAdmin` do plano do backend).
- [ ] **Step 2: `npx tsc --noEmit`** para confirmar que não há erro de tipo (nada ainda consome os tipos novos, só precisa compilar).
- [ ] **Step 3: Commit**

```bash
git add src/features/admin/types/admin.ts
git commit -m "feat(admin): add Product and ProductCategory admin types"
```

---

## Task 8: `/admin/categorias-produtos` — CRUD de categoria de produto

**Files:**
- Create: `src/app/admin/categorias-produtos/page.tsx` (+ `.test.tsx`)
- Create: `src/features/admin/components/ProductCategoryDialog.tsx`
- Modify: `src/app/admin/layout.tsx` (`NAV_ITEMS`)

**Interfaces:**
- Consumes: `ProductCategoryAdmin` (Tarefa 7), endpoints `/product-categories` (backend, Tarefa 4 do plano irmão).

Espelha `src/app/admin/categorias/page.tsx` + `CategoryDialog.tsx` quase 1:1 — sem o campo de cor, com um campo `order` (`<Input type="number">`) no lugar.

- [ ] **Step 1: Teste da página** — mesmo molde de `admin/categorias/page.test.tsx` (se existir) ou, na ausência, cobrir: lista renderiza nomes vindos da API, botão "Nova categoria" abre o dialog, excluir chama `DELETE /product-categories/:id` e re-busca a lista.
- [ ] **Step 2: Rodar e confirmar que falha.**
- [ ] **Step 3: Implementar `ProductCategoryDialog.tsx`** — campos `name` (texto) e `order` (número), `POST`/`PATCH` em `/product-categories`.
- [ ] **Step 4: Implementar a página** — `useApiResource<ProductCategoryAdmin[]>('/product-categories')`, lista simples (sem paginação, decisão do plano do backend), botão criar, editar, excluir com `ConfirmDialog`.
- [ ] **Step 5: Adicionar `{ href: '/admin/categorias-produtos', label: 'Categorias de produto' }` a `NAV_ITEMS`** em `admin/layout.tsx`, logo após `'Categorias'` (rótulo diferente de propósito — evita confundir com a categoria de conversa que já existe ali do lado).
- [ ] **Step 6: Rodar e confirmar que passa.**
- [ ] **Step 7: Commit**

```bash
git add src/app/admin/categorias-produtos src/features/admin/components/ProductCategoryDialog.tsx src/app/admin/layout.tsx
git commit -m "feat(admin): add product category CRUD"
```

---

## Task 9: `/admin/produtos` — CRUD de produto com upload de imagem

**Files:**
- Create: `src/app/admin/produtos/page.tsx` (+ `.test.tsx`)
- Create: `src/features/admin/components/ProductDialog.tsx`
- Modify: `src/app/admin/layout.tsx` (`NAV_ITEMS`)

**Interfaces:**
- Consumes: `ProductAdmin`, `ProductCategoryAdmin` (Tarefa 7), endpoints `/products` (admin) do backend (Tarefa 6 do plano irmão).

- [ ] **Step 1: Teste da página** — lista mostra nome, categoria, preço formatado e um `Switch` de ativo (igual `admin/menu/page.tsx` já faz pra `active`); excluir pede confirmação.
- [ ] **Step 2: Rodar e confirmar que falha.**
- [ ] **Step 3: Implementar `ProductDialog.tsx`**
  - Campos: `name`, `description` (`<textarea>`), `price` (`<Input type="number" step="0.01">`), `categoryId` (`<select>` populado por `useApiResource<ProductCategoryAdmin[]>('/product-categories')`), `order` (número), `active` (`Switch`), imagens (`<input type="file" accept="image/jpeg,image/png,image/webp" multiple>` com preview das miniaturas via `URL.createObjectURL`).
  - Submit monta um `FormData` (texto + arquivos sob a chave `images`) e chama `apiFetch('/products', { method: 'POST', body: formData })` (sem `JSON.stringify` — `apiFetch` já pula o `Content-Type` pra `FormData`, ver Decisão 5).
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

- **Cobertura do spec**: carrossel na home (Tarefas 2–3), página por produto (Tarefa 5), `/produtos` (Tarefa 4), cadastro no admin com categoria (Tarefas 7–9), preço público formatado (Tarefa 2 e 5) — todas as decisões do usuário têm tarefa.
- **Consistência de tipos**: `Product` (público, Tarefa 1) e `ProductAdmin` (admin, Tarefa 7) são definidos uma vez cada e só reaproveitados depois; nenhum componente redefine o shape.
- **Review Focus**: catálogo vazio (Tarefa 2 Step 1, Tarefa 4 Step 1), slug inexistente (Tarefa 5 Step 1), preço consistente (mesma função em Tarefa 2 e 5, não duas fórmulas), imagem ausente (`ImagePlaceholder` reaproveitado, nunca um `<Image src="">`), CTA do WhatsApp com nome do produto (Tarefa 5 Step 1) — todos com teste na tarefa dona.
- **Dependência entre repos**: este plano só pode rodar em produção depois do plano do backend estar implantado (os `lib/*.ts` da Tarefa 1 apontam pros endpoints de lá) — mas cada tarefa aqui continua testável isoladamente com o fetch mockado, igual ao resto do site já funciona com a API fora do ar.
