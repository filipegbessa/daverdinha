# daverdinha

Frontend do projeto Da Verdinha — site institucional + sistema de gestão (admin), num único app Next.js.

Repositório ainda vazio — o código é construído seguindo os planos de implementação abaixo, nessa ordem.

## Stack

Next.js 14 (App Router) + TypeScript, Tailwind CSS + shadcn/ui, Clerk (autenticação do admin), Jest + React Testing Library.

## Estrutura de rotas

- `/` — site institucional (público, sem login): hero, sobre, produtos, onde entregamos, localização, destaques, FAQ, avaliações do Google.
- `/politica-de-privacidade` — página pública.
- `/login` — acesso ao admin via Clerk.
- `/admin/*` — sistema de gestão (autenticado): dashboard, mensagens, menu, entregas, conversas.

## Organização de pastas

```
src/
  app/                # rotas — só page.tsx/layout.tsx, sem lógica de negócio
  features/
    site/              # tudo do site institucional (components/, lib/, types/)
    admin/             # tudo do admin (components/, lib/, types/)
  components/ui/       # shadcn — compartilhado entre site e admin
  lib/                 # infra compartilhada (analytics.ts)
  middleware.ts        # protege /admin/*
```

## Setup local

1. `cp .env.local.example .env.local` e preencher as variáveis (Clerk, número do WhatsApp, endereço, etc — ver `.env.local.example` depois do scaffold inicial).
2. `npm install`
3. `npm run dev`

## Deploy

Fase de validação (atual): Vercel, plano Hobby (grátis) — banco no Neon. Migração pra Railway planejada pra quando o projeto sair da fase de teste (ver `SPEC.md` → "Stack (decidida)" no repositório `da-verdinha` de planejamento).

## Planos de implementação

Esse repositório é construído seguindo, nessa ordem:

1. **Site institucional** — `2026-08-31-da-verdinha-site-institucional.md` (18 tasks: scaffold, seções do site, SEO, avaliações do Google).
2. **Admin** — `2026-08-31-da-verdinha-admin.md` (10 tasks: Clerk, dashboard, CRUDs de menu/entregas/mensagens, conversas).

Os planos completos (com todo o código, testes e passo a passo) ficam no repositório de planejamento do projeto, junto com `SPEC.md` (arquitetura e decisões) e `ROTEIRO-IMPLEMENTACAO.md` (ordem geral e configuração de serviços externos).

Backend consumido por este projeto: `daverdinha-api`.
