# daverdinha

Frontend do projeto Daverdinha (Next.js + Tailwind + shadcn/ui).

## Setup local

1. `cp .env.local.example .env.local`.
2. `npm install`
3. `npm run dev`

Dados do negócio (nome, telefone, endereço) ficam hardcoded em `src/data/business.ts`, não em `.env` — edite ali pra atualizar.

## Testes

`npm test`

## Estrutura

- `/` — site institucional (público, sem login).
- `/admin/*` — sistema de gestão (autenticado via Clerk, ver plano separado).

Ver `docs/superpowers/plans/2026-08-31-da-verdinha-site-institucional.md` e
`docs/superpowers/plans/2026-08-31-da-verdinha-admin.md` (raiz do monorepo) para o desenho completo.
