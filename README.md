# daverdinha

Frontend do projeto Daverdinha (Next.js + Tailwind + shadcn/ui + Clerk).

## Setup local

1. `cp .env.local.example .env.local` e preencher as chaves do Clerk (dashboard.clerk.com) e demais variáveis.
2. `npm install`
3. `npm run dev`

## Estrutura

- `/` — site institucional (público, sem login).
- `/politica-de-privacidade` — página pública.
- `/login` — acesso ao admin via Clerk.
- `/admin/*` — sistema de gestão (autenticado): dashboard, mensagens, menu, entregas, conversas.

## Testes

`npm test`

Ver os 3 planos em `docs/superpowers/plans/` (site institucional, admin, e o backend em `daverdinha-api`) pro desenho completo.
