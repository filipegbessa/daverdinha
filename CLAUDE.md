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

### Environment variables
- `NEXT_PUBLIC_API_URL`: base URL of `daverdinha-api`. Both the admin and the public delivery-zones section read from it.
- `SITE_MODE`: server-only, read through `src/lib/site-mode.ts`. Only the exact string `full` renders the full institutional site. Any other value, including unset or a typo, renders the `ComingSoon` landing. That is the fail-safe default, because the catalog and agenda have no backend yet. `/` is static, so changing the variable takes effect only after a redeploy. The `soon` landing makes no API calls. The flag also defines "pre-launch" for the rest of the site (see "Public site pages" below).
- `SITE_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (web push), and the Clerk keys.

### Public site pages
- Every page of the full site renders inside `SiteShell` (event bar above the header, header with nav, footer, floating WhatsApp button on mobile). `SiteShell` is synchronous: each page fetches its own data and passes it in. RTL can't render nested async Server Components, so keep it that way.
- `/site` is the pre-launch preview of the full home. It is always `noindex`. Before launch, the logo and the "Início" breadcrumb point to `/site` instead of `/`; `homeHref()` in `lib/paths.ts` decides which.
- Catalog and agenda data come from `lib/public-api.ts`. Like the delivery zones, these reads never throw. Before launch (`SITE_MODE` ≠ `full`), an empty or failing API falls back to the clearly-labelled samples in `features/site/data/samples.ts`, and the page shows a "Prévia do site" banner. In `full` mode samples never appear. Sample ids start with `sample-` (`isSample()`). The API contracts are in `features/site/types/catalog.ts` and `types/event.ts`. The endpoints don't exist in the API yet; the backend plans are `docs/plans/2026-11-04-catalogo-produtos.md` and `2026-11-04-agenda-eventos.md` in `daverdinha-api`.
- Product URLs are nested (`/produtos/[categoria]/[produto]`). The product is looked up by its unique slug only, and a category mismatch does a `permanentRedirect` to the current URL. A category with no active products is a 404.
- SEO: `lib/seo.ts` builds page metadata (canonical, `noindex` before launch). `lib/structured-data.ts` builds JSON-LD (`Product`, `Event`, `BreadcrumbList`), rendered through `JsonLd`, which escapes `<` because the text comes from the admin. `robots.ts` deliberately has no Disallow: preview pages rely on their own `noindex`. `sitemap.ts` lists the catalog and agenda only in `full` mode.
- Dates are formatted in `America/Sao_Paulo` (`lib/format.ts`), because Vercel renders in UTC. Prices go through `formatPrice` everywhere, so a card and a product page never disagree.
- The CEP checker (`lib/cep-check.ts`) is an interim browser-side check against BrasilAPI plus the covered-bairros list. It skips the bot's seeded CEP-range step, so it can occasionally differ from the bot. The target is a public `GET /delivery-locations/check` endpoint.
- Every WhatsApp/Instagram link that should count as a conversion goes through `ContactLink`, which sends a GA `contact_click` event with `channel` and `location`.

### Public site data sources
- Business info (name, phone, address, opening hours, JSON-LD `GardenStore`) is hardcoded in `src/data/business.ts`, not in env vars. `hours` stays empty until the client confirms them, and an empty list hides hours from the page and from the JSON-LD.
- Delivery areas are **not** hardcoded. `features/site/lib/delivery-zones.ts` fetches `GET /delivery-locations/covered` with `revalidate: 60`. That is the same `covered` data the bot uses. If the call fails or returns empty, the section disappears and `areaServed` is `[]`, on purpose: the site should not advertise an area no one has confirmed.

### Admin data layer (client-side, against the API)
Every admin page is a client component. All of them use these pieces instead of calling `fetch` themselves:
- `features/admin/lib/api-client.ts` (`useApiClient().apiFetch`): adds the Clerk bearer token, sets JSON content-type except for `FormData`, and throws with the API's `message`.
- `use-api-resource.ts`: reads, with `data`/`isLoading`/`error`/`refetch` and optional polling. Background polls never set `isLoading` back to true. Passing `path = null` skips the fetch.
- `use-api-mutation.ts`: writes. It resolves to `true`/`false` instead of throwing, so callers need no try/catch.
- `components/StatusMessage.tsx` and `components/ConfirmDialog.tsx`: loading/error states and delete confirmation. Errors use the palette's `text-berry` class, never raw `text-red-*`.
- `use-pagination.ts` + `TablePagination`: a filter change resets to page 1, and a page number past the end clamps to the last valid page. Filters on `/admin/conversas` go to the server as query params; search goes through `use-debounced-value`.
- `use-conversation-messages.ts`: loads the latest 50 messages, then polls only for new ones (`?since=`) and pages back with `?before=`. `since` is inclusive on the server, so the merge dedupes by `id`.

### Media in conversations
Image and audio messages fetch a short-lived signed R2 URL on demand (`GET /conversations/:id/messages/:messageId/media` → `{ url }`) through `apiFetch`. The URL is not included in the thread payload. `<img>`/`<audio>` point directly at R2, because those tags can't send an `Authorization` header. If loading fails, `onError` refetches the URL once and then shows an error, so it never loops. A reply with an attachment switches from `/reply` (JSON) to `/reply-image` (multipart), and the caption is optional. Client-side type/size checks mirror the backend limits, but the API has the final say.

### Routing and SEO
- `src/middleware.ts` uses Clerk to protect `/admin(.*)`.
- `next.config.ts` adds `X-Robots-Tag: noindex` to `/admin/*`. A `robots.txt` Disallow is deliberately not used for this.
- `public/sw.js` is a minimal service worker, there for PWA install and push. It has no caching strategy, on purpose.

### Design docs
Feature plans live in `docs/plans/`. The README is the most detailed description of how each admin page behaves (`/admin/menu`, `/admin/mensagens`, `/admin/entregas`, `/admin/conversas`, `/admin/categorias`). Check it before changing those pages.
