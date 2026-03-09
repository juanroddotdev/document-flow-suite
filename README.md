# DocumentFlow Suite

Privacy-first, client-side document triage. Turn messy uploads (HEIC, TIFF, sideways JPEGs) into standardized, 150-DPI PDFs—all in the browser. No server processing, no data leaving the user’s machine.

## What’s in this repo

Monorepo (pnpm + Turborepo):

| Path | Description |
|------|-------------|
| **apps/manual** | Product docs and reference (Starlight/Astro). Run to read the manual and context docs. |
| **apps/utility-v1** | Standalone converter UI (Vite + Lit). The Phase 1 internal tool. |
| **packages/pdf-engine** | Core logic: normalization, stapling, PDF export (TypeScript, pdf-lib). |
| **packages/ui-library** | Lit components (e.g. file thumbnails, tabletop). |
| **docs/context** | Reference .md (strategy, ROI, security, integration, etc.). Linked from the manual. |

## Prerequisites

- **Node.js** (LTS)
- **pnpm** (e.g. `corepack enable pnpm`)

## Commands

From the repo root:

```bash
pnpm install
pnpm dev          # run all apps in dev mode
pnpm build        # build all apps and packages
pnpm test         # run tests
```

Single app:

```bash
pnpm --filter @document-flow/manual dev    # manual (docs) at http://localhost:4321
pnpm --filter @document-flow/utility-v1 dev   # converter UI
```

## Docs and context

- **Manual (product + internal):** `pnpm --filter @document-flow/manual dev` — includes a **Context (Reference)** section that serves the `docs/context/*.md` files.
- **High-level vision and roadmap:** [docs/context/FULL_PROJECT_MANIFESTO.md](docs/context/FULL_PROJECT_MANIFESTO.md).
- **Internal DoD and legal:** [DOCS_INTERNAL.md](DOCS_INTERNAL.md).

## License

ISC.
