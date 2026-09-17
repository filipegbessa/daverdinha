# Landing "Em Construção" (Site Público) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o que `/` mostra em produção por uma landing "em construção" com logo, frase do negócio, WhatsApp, Instagram e endereço — mantendo o site institucional inteiro no repositório, compilando e testado, atrás de uma flag de ambiente que devolve o site completo ao ar sem alterar uma linha de código.

**Architecture:** Uma função server-only `getSiteMode()` lê `process.env.SITE_MODE` e devolve `'soon' | 'full'`. `src/app/page.tsx` passa a bifurcar nela: em `soon` renderiza um único componente novo `<ComingSoon />` e **não chama a API** de áreas de entrega; em `full` renderiza exatamente as 8 seções de hoje. O JSON-LD de `LocalBusiness` continua saindo nos dois modos (com `areaServed: []` em `soon`, que é o comportamento já previsto quando nada é confirmado pela API). Um `generateMetadata()` na página ajusta título/descrição por modo e — nos dois modos — passa a anunciar `/logo.jpeg` como imagem OpenGraph, que hoje não existe. Nenhum componente do site é movido ou apagado.

**Tech Stack:** Next.js 16.3.4 (App Router), React 19, TypeScript, Tailwind v4, Jest + React Testing Library.

**Spec:** Sem spec separada. Decisões tomadas com o dono do projeto em 2026-09-17:
- alternância por env flag (e não por rota `/preview` nem por branch);
- a página em construção **é indexável** — robots e sitemap ficam como estão e o JSON-LD continua sendo emitido;
- conteúdo da página: logo, frase do negócio, endereço, WhatsApp e Instagram. **Sem e-mail** — o negócio não tem um, e nada de e-mail entra em `businessInfo` nem na UI.

## Global Constraints

- **No commit trailers:** no `Co-Authored-By:` / `Claude-Session:` line in any commit message.
- **Stage files by name:** `git add <file> <file>`, never `git add -A` or `git add .`.
- **Nada é deletado nem movido.** `Header`, `Hero`, `About`, `Products`, `DeliveryZones`, `Location`, `Faq`, `Footer` e todos os seus testes continuam onde estão e continuam passando. A vantagem inteira da flag sobre apagar/mover é essa: quando `Products` ganhar as categorias reais (`PRODUCT_CATEGORIES` está literalmente vazio hoje), roda-se local com `SITE_MODE=full`, valida, e só então vira a chave em produção.
- **A flag é server-only — sem prefixo `NEXT_PUBLIC_`.** Todos os leitores (`page.tsx`) são Server Components; não há razão pra embutir a flag no bundle do browser.
- **O default é `soon`.** Variável ausente, vazia ou com typo (`ful`, `true`, `1`) cai em `soon`. Só a string exata `'full'` libera o site completo — a falha segura é esconder um site inacabado, não publicá-lo.
- **`businessInfo` não ganha campo de e-mail**, e `generateLocalBusinessJsonLd` não ganha `email`. `src/data/business.ts` e `src/data/business.test.ts` não são tocados por este plano.
- **`robots.ts` e `sitemap.ts` não são tocados.** A decisão é indexar a página em breve; ambos já fazem exatamente o certo (`allow: '/'`, sitemap com a home).
- ⚠️ **Virar a chave exige um redeploy.** `/` é renderizada estaticamente, então mudar `SITE_MODE` no painel da Vercel só surte efeito no próximo build ("Redeploy", sem push de código). Isso não é um toggle em tempo real — documentar no README pra ninguém se surpreender.
- ⚠️ **`metadata` faz merge raso** (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`, seção "Merging"): um segmento que define `openGraph` **substitui o objeto `openGraph` inteiro** do layout, não faz merge campo a campo. Por isso o `generateMetadata()` da página repete `title`, `description`, `type` e `url` junto com `images` — omitir qualquer um deles apaga o valor que `layout.tsx` define hoje.
- Este projeto roda Next 16.3.4, cujas APIs podem divergir do que o modelo "lembra" (ver `AGENTS.md`). Antes de escrever código, conferir o doc pertinente em `node_modules/next/dist/docs/` — os dois relevantes aqui (`01-getting-started/12-images.md` e `04-functions/generate-metadata.md`) já foram lidos na elaboração deste plano e confirmam as APIs usadas abaixo.
- `next/image` renderiza normalmente sob `next/jest` em jsdom — `ImagePlaceholder.test.tsx` já o exercita com `getByAltText`, sem mock nenhum. Não introduzir mock de `next/image`.

---

## Task 1: A flag `SITE_MODE`

**Files:**
- Create: `src/lib/site-mode.ts`
- Create: `src/lib/site-mode.test.ts`

**Interfaces:**
- Produces: `export type SiteMode = 'soon' | 'full'` e `export function getSiteMode(): SiteMode` — consumido pela Task 3.

- [ ] **Step 1: Write the failing test**

Create `src/lib/site-mode.test.ts`:

```typescript
import { getSiteMode } from './site-mode';

describe('getSiteMode', () => {
  const original = process.env.SITE_MODE;

  afterEach(() => {
    if (original === undefined) delete process.env.SITE_MODE;
    else process.env.SITE_MODE = original;
  });

  it("returns 'full' only for the exact string 'full'", () => {
    process.env.SITE_MODE = 'full';
    expect(getSiteMode()).toBe('full');
  });

  it("defaults to 'soon' when the variable is not set at all", () => {
    delete process.env.SITE_MODE;
    expect(getSiteMode()).toBe('soon');
  });

  it("falls back to 'soon' for an empty value", () => {
    process.env.SITE_MODE = '';
    expect(getSiteMode()).toBe('soon');
  });

  it("falls back to 'soon' for a typo or a truthy-looking value, never opening the site by accident", () => {
    process.env.SITE_MODE = 'ful';
    expect(getSiteMode()).toBe('soon');
    process.env.SITE_MODE = 'true';
    expect(getSiteMode()).toBe('soon');
    process.env.SITE_MODE = '1';
    expect(getSiteMode()).toBe('soon');
    process.env.SITE_MODE = 'FULL';
    expect(getSiteMode()).toBe('soon');
  });

  it('reads the variable on every call, not once at import time', () => {
    process.env.SITE_MODE = 'full';
    expect(getSiteMode()).toBe('full');
    process.env.SITE_MODE = 'soon';
    expect(getSiteMode()).toBe('soon');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- site-mode`
Expected: FAIL — `Cannot find module './site-mode'`.

- [ ] **Step 3: Write `src/lib/site-mode.ts`**

```typescript
/**
 * Qual cara o site público mostra em `/`.
 *
 * O site institucional completo continua inteiro no repositório — todas as
 * seções, todos os testes — mas boa parte do conteúdo ainda é placeholder
 * (`PRODUCT_CATEGORIES` está vazio esperando a cliente responder), então ele
 * fica atrás desta flag até o texto real existir. Enquanto isso `/` mostra uma
 * landing "em construção" com os canais de contato que já são reais.
 *
 * Server-only de propósito (sem `NEXT_PUBLIC_`): todo leitor desta função é um
 * Server Component, então não há motivo pra embutir a flag no bundle.
 *
 * Ausente, vazia ou escrita errada cai em 'soon': a falha segura é esconder um
 * site inacabado, não publicá-lo. Só a string exata 'full' libera o site
 * completo.
 *
 * ⚠️ `/` é estática, então mudar esta variável na Vercel só vale a partir do
 * próximo build — é "Redeploy", não um toggle em tempo real.
 */
export type SiteMode = 'soon' | 'full';

export function getSiteMode(): SiteMode {
  return process.env.SITE_MODE === 'full' ? 'full' : 'soon';
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- site-mode`
Expected: PASS, 5 testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/site-mode.ts src/lib/site-mode.test.ts
git commit -m "feat: add a server-only SITE_MODE flag defaulting to the coming-soon page"
```

---

## Task 2: O componente `ComingSoon`

**Files:**
- Create: `src/features/site/components/ComingSoon.tsx`
- Create: `src/features/site/components/ComingSoon.test.tsx`

**Interfaces:**
- Produces: `export function ComingSoon(): JSX.Element` — sem props, Server Component (sem `'use client'`), consumido pela Task 3.
- Consumes: `businessInfo` (`@/data/business`), `getWhatsAppUrl` (`@/features/site/lib/whatsapp`), `buttonVariants` (`@/components/ui/button`), `cn` (`@/lib/utils`), `Eyebrow` (`@/features/site/components/Eyebrow`) — tudo já existente, nada novo é criado.
- Asset: `public/logo.jpeg` (1280×1280, já no repositório).

- [ ] **Step 1: Write the failing tests**

Create `src/features/site/components/ComingSoon.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { ComingSoon } from './ComingSoon';

describe('ComingSoon', () => {
  it('says the site is on its way, as the page h1', () => {
    render(<ComingSoon />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nosso site está chegando');
  });

  it('shows the logo with the business name as its alt text', () => {
    render(<ComingSoon />);
    expect(screen.getByAltText('Daverdinha — Ateliê de Plantas')).toBeInTheDocument();
  });

  it('links to WhatsApp with the same greeting the rest of the site uses', () => {
    render(<ComingSoon />);
    const link = screen.getByRole('link', { name: 'Falar no WhatsApp' });
    expect(link).toHaveAttribute('href', expect.stringContaining('https://wa.me/5521986509259'));
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('links to Instagram', () => {
    render(<ComingSoon />);
    const link = screen.getByRole('link', { name: '@daverdinha_' });
    expect(link).toHaveAttribute('href', 'https://www.instagram.com/daverdinha_/');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('shows the real address and the business description', () => {
    render(<ComingSoon />);
    expect(
      screen.getByText('R. Capiberibe, 32 - Santo Cristo, Rio de Janeiro - RJ, 20220-030'),
    ).toBeInTheDocument();
    expect(screen.getByText(/cantinho verde pra chamar de seu/)).toBeInTheDocument();
  });

  it('keeps the privacy policy reachable and shows the CNPJ', () => {
    render(<ComingSoon />);
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute(
      'href',
      '/politica-de-privacidade',
    );
    expect(screen.getByText(/66\.371\.530\/0001-54/)).toBeInTheDocument();
  });

  it('offers no e-mail contact — the business does not have one', () => {
    const { container } = render(<ComingSoon />);
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- ComingSoon`
Expected: FAIL — `Cannot find module './ComingSoon'`.

- [ ] **Step 3: Write `src/features/site/components/ComingSoon.tsx`**

```tsx
import Image from 'next/image';
import Link from 'next/link';
import { AtSign, MapPin, MessageCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { businessInfo } from '@/data/business';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { Eyebrow } from '@/features/site/components/Eyebrow';

/**
 * A landing que `/` mostra enquanto `SITE_MODE` não for 'full'.
 *
 * Só entra aqui informação que já é verdade confirmada sobre o negócio —
 * logo, frase, endereço, WhatsApp, Instagram. Nada de placeholder: o motivo
 * de esconder o site institucional é justamente ele ainda ter placeholders.
 * Não há e-mail porque o negócio não tem um; um `mailto:` inventado seria
 * um canal de contato que ninguém lê.
 */
export function ComingSoon() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <Image
        src="/logo.jpeg"
        alt="Daverdinha — Ateliê de Plantas"
        width={176}
        height={176}
        priority
        className="size-36 rounded-full shadow-soft md:size-44"
      />

      <div className="max-w-md">
        <Eyebrow>Em breve</Eyebrow>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-ink md:text-4xl">
          Nosso site está chegando
        </h1>
        <p className="mt-3 text-ink-soft">{businessInfo.description}</p>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href={getWhatsAppUrl('Oi! Vim pelo site da Daverdinha 🌱')}
          target="_blank"
          className={cn(
            buttonVariants({ variant: 'default', size: 'lg' }),
            'gap-2 rounded-full bg-moss shadow-card transition-shadow hover:bg-moss/90 hover:shadow-soft',
          )}
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          Falar no WhatsApp
        </Link>
        <Link
          href={businessInfo.contact.instagram.url}
          target="_blank"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'lg' }),
            'gap-2 rounded-full border-moss-line text-ink hover:bg-moss/10',
          )}
        >
          <AtSign className="size-4 text-moss" aria-hidden="true" />
          {businessInfo.contact.instagram.handle}
        </Link>
      </div>

      <p className="flex max-w-sm items-center justify-center gap-1.5 text-sm text-ink-soft">
        <MapPin className="size-4 shrink-0 text-berry" strokeWidth={1.75} aria-hidden="true" />
        {businessInfo.address.formatted}
      </p>

      <div className="mt-4 flex flex-col items-center gap-1 border-t border-moss-line pt-6 text-xs text-ink-soft">
        <Link href="/politica-de-privacidade" className="underline underline-offset-4">
          Política de Privacidade
        </Link>
        <p>
          © {new Date().getFullYear()} Daverdinha · CNPJ {businessInfo.legal.cnpj}
        </p>
      </div>
    </main>
  );
}
```

Notas de implementação, se algo divergir:
- O nome acessível dos dois links vem do texto, porque os ícones são `aria-hidden` — é o mesmo padrão de `Header.tsx` e `Footer.tsx`, e é o que os testes consultam.
- `businessInfo.address.formatted` e `legal.cnpj` são renderizados como texto corrido; o teste do CNPJ usa regex porque ele divide um nó de texto com o `©`.
- `size: 'lg'` (h-9) em vez do `'default'` (h-8) do `Header`: aqui os botões são o elemento principal da tela, não um item de barra.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- ComingSoon`
Expected: PASS, 7 testes.

- [ ] **Step 5: Commit**

```bash
git add src/features/site/components/ComingSoon.tsx src/features/site/components/ComingSoon.test.tsx
git commit -m "feat: add the coming-soon landing with logo, WhatsApp, Instagram and address"
```

---

## Task 3: `page.tsx` bifurca no modo, e passa a anunciar a logo no OpenGraph

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.test.tsx`

**Interfaces:**
- Produces: `export function generateMetadata(): Metadata` em `page.tsx` (novo export; hoje a página não tem metadata própria e herda tudo de `layout.tsx`).
- Consumes: `getSiteMode` (Task 1), `ComingSoon` (Task 2).

- [ ] **Step 1: Rewrite the test file**

Replace `src/app/page.test.tsx` in full:

```typescript
import { render, screen } from '@testing-library/react';
import Page, { generateMetadata } from './page';
import { getCoveredDeliveryZones } from '@/features/site/lib/delivery-zones';

// Hero is an async Server Component (fetches active hero slides) — RTL can't
// resolve a nested async component synchronously, so it's mocked here. Hero has
// its own dedicated tests (Hero.test.tsx) covering the fetch/fallback/carousel logic.
jest.mock('@/features/site/components/Hero', () => ({
  Hero: () => <h1>Um cantinho verde pra chamar de seu</h1>,
}));

jest.mock('@/features/site/lib/delivery-zones', () => ({
  getCoveredDeliveryZones: jest.fn(),
}));

const mockZones = getCoveredDeliveryZones as jest.Mock;

// Page itself is an async Server Component now, so it's awaited into an
// element tree before handing it to RTL.
const renderPage = async () => render(await Page());

const originalMode = process.env.SITE_MODE;

afterEach(() => {
  if (originalMode === undefined) delete process.env.SITE_MODE;
  else process.env.SITE_MODE = originalMode;
});

describe('Home page — full site (SITE_MODE=full)', () => {
  beforeEach(() => {
    process.env.SITE_MODE = 'full';
    mockZones.mockResolvedValue([{ zone: 'Centro', bairros: ['Gamboa'] }]);
  });

  it('renders the core static sections', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Um cantinho verde pra chamar de seu');
    expect(screen.getByText('Onde entregamos')).toBeInTheDocument();
    expect(screen.getByText('Onde estamos')).toBeInTheDocument();
    expect(screen.getByText('Perguntas frequentes')).toBeInTheDocument();
    expect(screen.getAllByText('Daverdinha').length).toBeGreaterThan(0);
  });

  it('renders the LocalBusiness JSON-LD script tag', async () => {
    const { container } = await renderPage();

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });

  it('feeds the covered zones into the structured data Google reads', async () => {
    mockZones.mockResolvedValue([
      { zone: 'Centro', bairros: ['Gamboa'] },
      { zone: 'Zona Sul', bairros: ['Botafogo'] },
    ]);

    const { container } = await renderPage();

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(script!.innerHTML).areaServed).toEqual(['Centro', 'Zona Sul']);
  });

  it('drops the delivery section when nothing is covered, and advertises no area', async () => {
    mockZones.mockResolvedValue([]);

    const { container } = await renderPage();

    expect(screen.queryByText('Onde entregamos')).not.toBeInTheDocument();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(script!.innerHTML).areaServed).toEqual([]);
  });

  it('keeps the institutional title and advertises the logo as the OpenGraph image', () => {
    const metadata = generateMetadata();

    expect(metadata.title).toBe('Daverdinha — Ateliê de plantas no Rio de Janeiro');
    expect(metadata.openGraph?.images).toEqual([
      { url: '/logo.jpeg', width: 1280, height: 1280, alt: 'Daverdinha — Ateliê de Plantas' },
    ]);
  });
});

describe('Home page — coming soon (SITE_MODE unset)', () => {
  beforeEach(() => {
    delete process.env.SITE_MODE;
    mockZones.mockResolvedValue([{ zone: 'Centro', bairros: ['Gamboa'] }]);
  });

  it('renders the coming-soon landing instead of the institutional sections', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nosso site está chegando');
    expect(screen.queryByText('Onde entregamos')).not.toBeInTheDocument();
    expect(screen.queryByText('Perguntas frequentes')).not.toBeInTheDocument();
  });

  it('never calls the delivery API — the landing must not depend on the backend being up', async () => {
    await renderPage();

    expect(mockZones).not.toHaveBeenCalled();
  });

  it('still emits the LocalBusiness JSON-LD, advertising no served area', async () => {
    const { container } = await renderPage();

    const script = container.querySelector('script[type="application/ld+json"]');
    const json = JSON.parse(script!.innerHTML);
    expect(json.name).toBe('Daverdinha');
    expect(json.telephone).toBe('5521986509259');
    expect(json.areaServed).toEqual([]);
  });

  it('keeps the WhatsApp and Instagram links reachable', async () => {
    await renderPage();

    expect(screen.getByRole('link', { name: 'Falar no WhatsApp' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/5521986509259'),
    );
    expect(screen.getByRole('link', { name: '@daverdinha_' })).toBeInTheDocument();
  });

  it('titles the page "Em breve" and repeats every OpenGraph field, since metadata merges shallowly', () => {
    const metadata = generateMetadata();

    expect(metadata.title).toBe('Daverdinha — Em breve');
    expect(metadata.openGraph?.title).toBe('Daverdinha — Em breve');
    expect(metadata.openGraph?.description).toBe(metadata.description);
    expect(metadata.openGraph).toHaveProperty('type', 'website');
    expect(metadata.openGraph?.images).toEqual([
      { url: '/logo.jpeg', width: 1280, height: 1280, alt: 'Daverdinha — Ateliê de Plantas' },
    ]);
  });
});
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `npm test -- src/app/page`
Expected: FAIL — `page.tsx` não exporta `generateMetadata` e renderiza o site completo independente de `SITE_MODE`.

- [ ] **Step 3: Rewrite `src/app/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { Header } from '@/features/site/components/Header';
import { Hero } from '@/features/site/components/Hero';
import { About } from '@/features/site/components/About';
import { Products } from '@/features/site/components/Products';
import { DeliveryZones } from '@/features/site/components/DeliveryZones';
import { Location } from '@/features/site/components/Location';
import { Faq } from '@/features/site/components/Faq';
import { Footer } from '@/features/site/components/Footer';
import { ComingSoon } from '@/features/site/components/ComingSoon';
import { businessInfo, generateLocalBusinessJsonLd } from '@/data/business';
import { getCoveredDeliveryZones } from '@/features/site/lib/delivery-zones';
import { getSiteMode } from '@/lib/site-mode';

const OG_IMAGE = {
  url: '/logo.jpeg',
  width: 1280,
  height: 1280,
  alt: 'Daverdinha — Ateliê de Plantas',
};

export function generateMetadata(): Metadata {
  const soon = getSiteMode() === 'soon';

  const title = soon ? 'Daverdinha — Em breve' : 'Daverdinha — Ateliê de plantas no Rio de Janeiro';
  const description = soon
    ? 'Nosso site está em construção. Enquanto isso, fale com a gente pelo WhatsApp ou pelo Instagram.'
    : businessInfo.description;

  return {
    title,
    description,
    // `metadata` faz merge raso entre segmentos: definir `openGraph` aqui
    // substitui o objeto inteiro que `layout.tsx` define, campo a campo não
    // existe. Por isso tudo é repetido, não só `images`.
    openGraph: {
      title,
      description,
      type: 'website',
      url: process.env.NEXT_PUBLIC_SITE_URL,
      images: [OG_IMAGE],
    },
  };
}

export default async function Page() {
  const mode = getSiteMode();

  // A API só é consultada no modo 'full'. Uma página que só diz "em breve" não
  // tem por que cair junto com o backend do bot.
  const zones = mode === 'full' ? await getCoveredDeliveryZones() : [];

  return (
    <>
      {/* Fetched once here and handed to both consumers, so the structured data
          Google reads and the section a visitor reads can never disagree. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateLocalBusinessJsonLd(zones.map((zone) => zone.zone))),
        }}
      />
      {mode === 'soon' ? (
        <ComingSoon />
      ) : (
        <>
          <Header />
          <Hero />
          <About />
          <Products />
          <DeliveryZones zones={zones} />
          <Location />
          <Faq />
          <Footer />
        </>
      )}
    </>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/app/page`
Expected: PASS, 10 testes (5 em `full`, 5 em `soon`).

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/page.test.tsx
git commit -m "feat: serve the coming-soon landing at / unless SITE_MODE=full"
```

---

## Task 4: Final wiring — env de exemplo, README, suíte completa, build

**Files:**
- Modify: `.env.local.example`
- Modify: `README.md`
- Test: nenhum novo — a verificação desta task é a suíte completa, o type-check e o build de produção.

- [ ] **Step 1: Document the flag in `.env.local.example`**

⚠️ Este arquivo casa com o padrão de arquivos sensíveis do sandbox de leitura, então ele não foi lido na elaboração do plano. **Antes de escrever, confirme que `SITE_MODE` ainda não está lá** (`grep -c SITE_MODE .env.local.example`); se já estiver, só ajuste o comentário em vez de duplicar a chave.

```bash
grep -q SITE_MODE .env.local.example || cat >> .env.local.example <<'EOF'

# 'soon' | 'full' — qual cara o "/" mostra (ver src/lib/site-mode.ts).
# Ausente, vazia ou escrita errada = 'soon' (landing em construção).
# Local, deixe 'full' pra trabalhar no site institucional.
SITE_MODE=full
EOF
```

- [ ] **Step 2: Update `README.md`**

Adicionar uma seção nova logo depois de "## Setup local" (antes de "### Áreas de entrega"), cobrindo:

- Que `/` hoje serve uma landing **em construção** (`ComingSoon.tsx`), e que o site institucional completo continua inteiro no repositório atrás de `SITE_MODE`.
- A semântica exata da flag: só `SITE_MODE=full` abre o site completo; ausente, vazia ou com typo cai em `soon`. Server-only, sem `NEXT_PUBLIC_`.
- **Por que uma flag e não deletar/mover o código:** o site institucional ainda tem placeholder (`PRODUCT_CATEGORIES` está vazio esperando resposta da cliente). A flag mantém ele compilando e com testes passando, então dá pra evoluí-lo local com `SITE_MODE=full` sem nada disso vazar pra produção.
- ⚠️ Que virar a chave em produção **exige um redeploy** — `/` é estática, então mexer na variável no painel da Vercel só vale no próximo build ("Redeploy", sem push de código).
- Que a landing é **indexável de propósito**: `robots.ts` segue liberando `/` e o JSON-LD de `LocalBusiness` continua sendo emitido (com `areaServed: []`, já que nada foi confirmado pela API), pra quem buscar "Daverdinha" achar o negócio e os contatos.
- Que a landing **não chama a API** — ela não depende da `daverdinha-api` estar de pé.
- Que os canais de contato são WhatsApp e Instagram; **não há e-mail** porque o negócio não tem um.

- [ ] **Step 3: Run the full suite, the type-check and the production build**

```bash
npm test
npx tsc --noEmit
npm run build
```

Expected: all PASS, build succeeds. Duas notas conhecidas deste repositório:
- `npm run build` precisa de `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` real vindo do `.env.local` (não um placeholder) e de `NEXT_PUBLIC_SITE_URL` (`sitemap.ts` e `robots.ts` lançam sem ele). Falha só nisso é lacuna de ambiente local, não defeito do diff — confirme o build num shell comum ou na CI antes de publicar.
- Nenhum teste existente fora de `src/app/page.test.tsx` deveria precisar de ajuste: os componentes do site não foram tocados e `business.ts` não mudou. Se algum quebrar, investigue antes de editá-lo — é sinal de acoplamento não previsto aqui.

- [ ] **Step 4: Verify both modes by eye**

```bash
SITE_MODE=full npm run dev   # deve mostrar o site institucional completo
npm run dev                  # sem a variável, deve mostrar a landing em construção
```

Confira na landing: logo carregada e redonda, os dois botões clicáveis abrindo WhatsApp e Instagram em nova aba, endereço legível, e a tela inteira sem scroll horizontal em largura de celular (~375px).

- [ ] **Step 5: Commit**

```bash
git add .env.local.example README.md
git commit -m "docs: document SITE_MODE and the coming-soon landing"
```

---

## Deploy (fora do escopo dos commits — passos manuais)

1. Merge/deploy normal. Como `SITE_MODE` **não existe** na Vercel, o default `soon` já entra em vigor: `/` passa a servir a landing.
2. Quando o site institucional estiver pronto: criar `SITE_MODE=full` nas variáveis de ambiente do projeto na Vercel e clicar **Redeploy**. Nenhum código muda.
3. Pra voltar pra "em construção": apagar a variável (ou setar `soon`) e redeployar.

---

## Self-Review

**Cobertura das decisões** — env flag em vez de rota `/preview` ou branch → Task 1 + Task 3. Landing indexável, com JSON-LD preservado e `robots.ts`/`sitemap.ts` intocados → Task 3 (teste "still emits the LocalBusiness JSON-LD") + Global Constraints. Conteúdo pedido — logo, frase do negócio, endereço, WhatsApp, Instagram → Task 2, um teste por item. Ausência de e-mail → Task 2 tem um teste que falha se algum `mailto:` aparecer, e uma Global Constraint impedindo que `business.ts` ganhe o campo.

**Placeholder scan** — sem TBD/TODO. `site-mode.ts`, `ComingSoon.tsx`, `page.tsx` e os três arquivos de teste estão dados por inteiro, reproduzíveis só a partir deste plano. A única prosa livre é o texto do README (Task 4, Step 2), com os pontos obrigatórios enumerados.

**Consistência de tipos** — nenhum tipo existente muda. `SiteMode` é novo e local a `src/lib/site-mode.ts`. `DeliveryZone[]` continua sendo o que `DeliveryZones` recebe; no modo `soon` ele simplesmente não é renderizado, e o `[]` que alimenta `generateLocalBusinessJsonLd` é o mesmo caminho já exercitado hoje quando a API falha.

**Escopo** — frontend público apenas. `/admin/*`, o `clerkMiddleware`, `/politica-de-privacidade` e a `daverdinha-api` não são tocados; a landing inclusive mantém o link pra política de privacidade acessível, porque a LGPD não entra em recesso junto com o site. Sem dependência de nenhum plano do backend — este é o primeiro plano da série que roda sozinho.

**Risco residual** — um: a expectativa de "virar a chave" ser instantânea. `/` é estática, então não é; está marcado com ⚠️ nas Global Constraints, no docstring de `site-mode.ts`, no README (Task 4) e na seção de Deploy. Se um dia for preciso que seja instantâneo, o caminho é forçar renderização dinâmica na página (`export const dynamic = 'force-dynamic'`), ao custo de perder o cache estático da home — uma troca que não vale a pena enquanto a landing for temporária.
