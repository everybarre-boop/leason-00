# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Single-page lead-collection app: a Korean lesson-inquiry form that captures name/email/phone/message into a Supabase Postgres `leads` table. Next.js 15 (App Router) + Tailwind v4 + Drizzle ORM.

## Commands

```bash
npm run dev          # dev server at http://localhost:3000
npm run build        # production build
npm run start        # serve production build
npm run lint         # next lint (ESLint 9, eslint-config-next)

npm run db:push      # apply db/schema.ts directly to the DB (used here instead of migrations)
npm run db:generate  # generate SQL migration from schema changes
npm run db:migrate   # apply generated migrations
npm run db:studio    # Drizzle Studio
```

There is no test runner configured.

## Architecture

**Submit flow (the core path):** [app/lead-form.tsx](app/lead-form.tsx) (client component) calls the `submitLead` server action in [app/actions.ts](app/actions.ts), which re-validates input server-side and inserts via Drizzle. The DB is never touched from the client. On success the form shows a confetti screen ([app/confetti.ts](app/confetti.ts)); on failure it renders the returned error string. `submitLead` returns a `{ ok: true } | { ok: false; error }` result rather than throwing — keep this contract when editing.

**Validation is duplicated on purpose:** the client has HTML `required`/`type` hints, but [app/actions.ts](app/actions.ts) trims, checks required fields, email format, and length caps again because the server action is the real trust boundary.

**Database layer:**
- [db/schema.ts](db/schema.ts) is the single source of truth for the `leads` table and exports `Lead` / `NewLead` inferred types. Schema changes flow to the DB via `db:push`.
- [db/index.ts](db/index.ts) creates the shared `db` client. It uses `postgres` with `{ prepare: false }` — **required** because the connection goes through Supabase's transaction-mode pooler (port 6543), which does not support prepared statements. Do not remove this.
- [lib/supabase.ts](lib/supabase.ts) is a supabase-js client for client-side use; it is **not** used by the submit path and needs `NEXT_PUBLIC_SUPABASE_ANON_KEY`, which the DB insert does not.

**Import alias:** `@/*` maps to the project root (see [tsconfig.json](tsconfig.json)), e.g. `@/db`, `@/db/schema`.

## Environment & config gotchas

- Secrets live in `.env.local` (gitignored via `.env*.local`). `.env.example` documents the shape.
- **`DATABASE_URL` passwords must be URL-encoded** — Supabase-generated passwords often contain `#`, `$`, `+` which break URL parsing if left raw (`#` → `%23`, `$` → `%24`, `+` → `%2B`).
- [drizzle.config.ts](drizzle.config.ts) explicitly loads `.env.local` via `dotenv` because drizzle-kit does not read it automatically (Next.js does). Without this, `db:*` commands fail with "connection url required".
- `/db/migrations` is gitignored.

## Language

Always respond to the user in Korean (한글).

UI text, comments, and commit messages in this repo are Korean. Match that when editing user-facing strings.
