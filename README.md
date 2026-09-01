# daverdinha

Frontend do projeto Da Verdinha (Next.js + Tailwind + shadcn/ui).

## Setup local

1. `cp .env.local.example .env.local` e preencher `NEXT_PUBLIC_WHATSAPP_NUMBER` com o número real.
2. `npm install`
3. `npm run dev`

## Testes

`npm test`

## Estrutura

- `/` — site institucional (público, sem login).
- `/admin/*` — sistema de gestão (autenticado via Clerk, ver plano separado).

Ver `docs/superpowers/plans/2026-08-31-da-verdinha-site-institucional.md` e
`docs/superpowers/plans/2026-08-31-da-verdinha-admin.md` (raiz do monorepo) para o desenho completo.
