# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

Frontend for Daverdinha, a plant atelier in Rio de Janeiro (Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui on `@base-ui/react`, Clerk). It holds two apps:

- **Public site** (`/`, `/site`, `/produtos`, `/produtos/[categoria]`, `/produtos/[categoria]/[produto]`, `/agenda`, `/agenda/[slug]`, `/politica-de-privacidade`, `robots.ts`, `sitemap.ts`, `manifest.ts`). Code lives in `src/features/site/`.
- **Admin** (`/admin/*`, protected by Clerk). It is the control panel for a WhatsApp bot run by a separate backend repo, `daverdinha-api`. Code lives in `src/features/admin/`.

The README, UI copy, docs and most code comments are in Brazilian Portuguese. Keep new user-facing text in pt-BR.

## Commands

```bash
npm run dev                         # local dev server
npm test                            # Jest (jsdom), all tests
npx jest src/path/to/file.test.tsx  # single test file
npx jest -t "test name"             # filter by test name
npm run build                       # production build; also the only type check
node scripts/generate-assets.mjs    # regenerate logo/favicon/PWA icons from public/original/ (output is committed)
```

The project has no ESLint. CI (`.github/workflows/ci.yml`) runs `npm test` and then `npm run build` on every PR and on every push to `main`. Vercel deploys `main` automatically, so that CI run is the only check before production. A build needs Clerk keys in the env; CI uses fake keys in the format `pk_test_<base64(domain)$>`.

Tests sit next to the file they cover (`foo.tsx` + `foo.test.tsx`). `jest.setup.ts` polyfills `matchMedia` and `PointerEvent` for jsdom. Tests that need Node instead of jsdom use a `@jest-environment node` docblock (see `src/middleware.test.ts`). Path alias: `@/` → `src/`.

## Architecture

### Two UIs, two design systems
The site (public pages + store) and the admin are separate UIs. Each has its own palette and its own components, and neither imports the other's visual components:

- **Admin** (`src/app/admin/**`, `src/app/login`, `src/features/admin/**`) is generic and neutral. Colors come only from the shadcn semantic tokens in `globals.css` (`primary`, `secondary`, `muted`, `muted-foreground`, `destructive`, `border`, `background`, `foreground`, `ring`), never from the site palette (`moss`, `berry`, `sand`, `paper`, `ink`…). Components: `src/components/ui/` (shadcn) + `src/features/admin/components/`.
- **Site** (`src/app/*` outside admin/login, `src/features/site/**`, `src/features/store/**`) uses the brand palette from `tailwind.config.ts` and its own components in `src/features/site/components/`. It does not use `src/components/ui/`.
- Both follow the same rule: one component per UI element, with `variant`/`size` props. Add a variant (not a new component) only when something differs a lot, and don't copy class strings between files.

### Environment variables
- `NEXT_PUBLIC_API_URL`: base URL of `daverdinha-api`. Both the admin and the public delivery-zones section read from it.
- `SITE_MODE`: server-only, read through `src/lib/site-mode.ts`. Only the exact string `full` renders the full institutional site. Any other value, including unset or a typo, renders the `ComingSoon` landing. That is the fail-safe default, because the catalog and agenda have no backend yet. `/` is static, so changing the variable takes effect only after a redeploy. The `soon` landing makes no API calls. The flag also defines "pre-launch" for the rest of the site (see "Public site pages" below).
- `SITE_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (web push), and the Clerk keys.

### Public site pages
- Every page of the full site renders inside `SiteShell` (header with nav, footer, floating WhatsApp button on mobile). `SiteShell` is synchronous: each page fetches its own data and passes it in. RTL can't render nested async Server Components, so keep it that way.
- Home hero: `Hero` takes a list of `HeroSlide`s (`types/hero-slide.ts`, read from `GET /hero-slides/active`, which the API doesn't have yet). With one slide it is a static section. With two or more it becomes `HeroSlideshow`: all slides are in the HTML, the first slide's title is the page's only H1, and there is a pause button. With no API data, the home falls back to `DEFAULT_HERO_SLIDE` (`data/hero.ts`).
- Home showcase: `ProductsSection` shows only featured products (`getFeaturedProducts()` → `?featured=true`). Its tags are buttons that filter in place. The "Ver todos" link follows the selected category, which keeps category pages reachable from the home for Google. `/produtos` and category pages still use `CategoryChips`, which are real links.
- `Carousel` is a plain row until its items overflow the width; only then does it show arrows. Swiping is native scroll-snap. The product showcase, event lists and related products use it.
- The event page shows the event, then where it happens (map + directions), the other upcoming events and the featured products.
- `/site` is the pre-launch preview of the full home. It is always `noindex`. Before launch, the logo and the "Início" breadcrumb point to `/site` instead of `/`; `homeHref()` in `lib/paths.ts` decides which.
- Catalog and agenda data come from `lib/public-api.ts`. Like the delivery zones, these reads never throw. Before launch (`SITE_MODE` ≠ `full`), an empty or failing API falls back to the clearly-labelled samples in `features/site/data/samples.ts`, and the page shows a "Prévia do site" banner. In `full` mode samples never appear. Sample ids start with `sample-` (`isSample()`). The API contracts are in `features/site/types/catalog.ts` and `types/event.ts`. The endpoints don't exist in the API yet; the backend plans are `docs/plans/2026-11-04-catalogo-produtos.md` and `2026-11-04-agenda-eventos.md` in `daverdinha-api`.
- Product URLs are nested (`/produtos/[categoria]/[produto]`). The product is looked up by its unique slug only, and a category mismatch does a `permanentRedirect` to the current URL. A category with no active products is a 404.
- SEO: `lib/seo.ts` builds page metadata (canonical, `noindex` before launch). `lib/structured-data.ts` builds JSON-LD (`Product`, `Event`, `BreadcrumbList`), rendered through `JsonLd`, which escapes `<` because the text comes from the admin. `robots.ts` deliberately has no Disallow: preview pages rely on their own `noindex`. `sitemap.ts` lists the catalog and agenda only in `full` mode.
- Dates are formatted in `America/Sao_Paulo` (`src/lib/format.ts`, shared with the store and the admin: `formatDateTime`), because Vercel renders in UTC and the admin runs in the browser's timezone. Prices go through `formatPrice` (BRL) or `formatCurrency` (any currency) from the same module, so a card, a product page and an order never disagree.
- The CEP checker (`lib/cep-check.ts`) asks the API (`GET /delivery-locations/check`), which runs the bot's own resolution (seeded CEP ranges, then BrasilAPI, Rio only), so the site and WhatsApp always agree. The answer is cached by the Vercel CDN for 10 minutes per CEP.
- Every WhatsApp/Instagram link that should count as a conversion goes through `ContactLink`, which sends a GA `contact_click` event with `channel` and `location`.

### Public site data sources
- Business info (name, phone, address, opening hours, JSON-LD `GardenStore`) is hardcoded in `src/data/business.ts`, not in env vars. `hours` stays empty until the client confirms them, and an empty list hides hours from the page and from the JSON-LD.
- Delivery areas are **not** hardcoded. `features/site/lib/delivery-zones.ts` fetches `GET /delivery-locations/covered` with `revalidate: 60`. That is the same `covered` data the bot uses. If the call fails or returns empty, the section disappears and `areaServed` is `[]`, on purpose: the site should not advertise an area no one has confirmed.

### Admin data layer (client-side, against the API)
Every admin page is a client component. All of them use these pieces instead of calling `fetch` themselves:
- `features/admin/lib/api-client.ts` (`useApiClient().apiFetch`): adds the Clerk bearer token, sets JSON content-type except for `FormData`, and throws with the API's `message`.
- `use-api-resource.ts`: reads, with `data`/`isLoading`/`isRefreshing`/`error`/`refetch` and optional polling. `isLoading` is only the first load; `isRefreshing` is a new page, new filters or a `refetch()` over data already on screen. Background polls set neither. Passing `path = null` skips the fetch.
- `use-api-mutation.ts`: writes. It resolves to `true`/`false` instead of throwing, so callers need no try/catch.
- `components/StatusMessage.tsx` and `components/ConfirmDialog.tsx`: loading/error states and delete confirmation. Errors use `text-destructive`, never raw `text-red-*` nor the site palette.
- `use-paginated-resource.ts` + `TablePagination`: one hook per paginated list (`usePaginatedResource('/products', { q, category })`). It builds the query string, resets to page 1 when a filter changes, clamps a page number past the end, and returns `pagination` to spread into `<TablePagination {...pagination} itemLabel="…" />`. Filters go to the server as query params; search goes through `use-debounced-value`. It wraps `use-pagination.ts`, which pages shouldn't use directly.
- `use-conversation-messages.ts`: loads the latest 50 messages, then polls only for new ones (`?since=`) and pages back with `?before=`. `since` is inclusive on the server, so the merge dedupes by `id`.

### Admin UI checklist (every new screen or change)
These keep slipping, so check them before calling an admin change done:

1. **Pagination.** A list that can grow with use (conversas, produtos, marcadores, pedidos) is paginated on the server and uses `usePaginatedResource` + `TablePagination`. Only fixed or tiny sets stay unpaginated, on purpose: menu items, the 160 bairros in `/admin/entregas`, catalog categories. A dropdown that needs "all" of a paginated resource asks for `?perPage=100` (the API max) and says so in a comment.
2. **Reuse before creating.** Look in `src/components/ui/` and `src/features/admin/components/` first. Page title + actions: `PageHeader`. Card lists: `AdminList` + `AdminListItem` (has the empty state). Create/edit dialogs: `FormDialog` (Cancelar/Salvar footer, pending, error). Fields: `FormField` (label + hint wired with `aria-describedby`) and `SwitchField`. Selects: `NativeSelect`. Delete: `ConfirmDialog`. Tables: `DataTable`. On/off filter buttons ("Não lidas", "Atende"): `ToggleButton` (`aria-pressed`). Pills ("Destaque", order status, a marcador's name): `Badge` (`size`, or `color` for a marcador; `badgeVariants` + `badgeColorStyle` when the pill is a button), and `ColorDot` where only the color fits. Section and zone headings: `SectionLabel` (`variant="title"` for a page section, the default `label` for a zone/block). "Voltar para…" above a detail page: `BackLink`. Icons are `lucide-react`, never text glyphs or emoji (☰ ✕ ▲ 📎); an icon-only action is `<Button variant="ghost" size="icon|icon-sm|icon-xs" aria-label="…">` with the icon `aria-hidden`. Hand-rolling one of these again is a review finding; if one doesn't fit, extend it with a variant.
3. **Every action shows that it is running.** Buttons that call the API use `<Button loading={mutation.isPending}>` (disabled + `aria-busy` + spinner; `loadingText` for "Salvando..."). A list being reloaded, paged or toggled is wrapped in `BusyRegion`/`AdminList busy={…}` with `isRefreshing || mutation.isPending`. Per-row toggles that run in parallel (`/admin/entregas`, marcadores in a conversation) track their own pending ids and show a `Loader2` spinner next to the row. Nothing should sit still while a request is in flight.
4. **Loading is always obvious, and always under the title.** Every page renders its `PageHeader` (and `BackLink` on detail pages) in every state; no early return without the title. The first load is `LoadingState` (spinner + text, `role="status"`) below the header, and a load error is `ErrorAlert` below it. Header actions that need the data stay disabled until it arrives. A refresh over data already on screen is `BusyRegion` (dims, blocks clicks, `aria-busy`, spinner on top). These two (`StatusMessage.tsx`) are the only loading components: don't write "Carregando..." by hand (`LoadingState size="sm"` inside a message).

### Media in conversations
Image and audio messages fetch a short-lived signed R2 URL on demand (`GET /conversations/:id/messages/:messageId/media` → `{ url }`) through `apiFetch`. The URL is not included in the thread payload. `<img>`/`<audio>` point directly at R2, because those tags can't send an `Authorization` header. If loading fails, `onError` refetches the URL once and then shows an error, so it never loops. A reply with an attachment switches from `/reply` (JSON) to `/reply-image` (multipart), and the caption is optional. Client-side type/size checks mirror the backend limits, but the API has the final say.

### Routing and SEO
- `src/middleware.ts` uses Clerk to protect `/admin(.*)`.
- `next.config.ts` adds `X-Robots-Tag: noindex` to `/admin/*`. A `robots.txt` Disallow is deliberately not used for this.
- `public/sw.js` is a minimal service worker, there for PWA install and push. It has no caching strategy, on purpose.

### Design docs
Feature plans live in `docs/plans/`. The README is the most detailed description of how each admin page behaves (`/admin/menu`, `/admin/mensagens`, `/admin/entregas`, `/admin/conversas`, `/admin/marcadores`, `/admin/produtos`, `/admin/categorias`). Check it before changing those pages.
