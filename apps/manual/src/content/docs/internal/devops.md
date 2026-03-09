---
title: Development Operations
description: Deployment pipeline, backend orchestration, and tech debt log. Architect's Vault.
sidebar:
  badge:
    text: Internal
    variant: caution
---

## Deployment Pipeline

- **Manual (Starlight/Astro):** Static output to `dist/`; deploy to any static host (Vercel, Netlify, Cloudflare Pages).
- **Utility-v1 (Vite):** Static SPA; same deployment targets.
- **Commands:** `pnpm build` from root runs `turbo run build` for all packages and apps.

## Backend Orchestration

- **Stack:** Supabase (Auth, Database) + Hono (Edge API).
- **Purpose:** License management and metadata only—**never** document processing.
- **Schema / Auth / API routes:** *To be documented as backend is implemented.*

## Tech Debt Log

Known "hacks" or shortcuts to be addressed in v2.0:

- *To be populated as development progresses.*
