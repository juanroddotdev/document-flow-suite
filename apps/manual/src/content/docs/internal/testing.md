---
title: Testing
description: Test setup and rules for pdf-engine and ui-library. Architect's Vault.
sidebar:
  badge:
    text: Internal
    variant: caution
---

## Overview

- **Runner:** Vitest with happy-dom
- **Root:** `pnpm test` runs `turbo run test`
- **Packages with tests:** `@document-flow/pdf-engine`, `@document-flow/ui-library`
- **Apps:** `manual` and `utility-v1` do not have test scripts yet; Turbo skips them

---

## Running Tests

| Command | Purpose |
|---------|---------|
| `pnpm test` | Run all tests (all packages) |
| `pnpm --filter @document-flow/pdf-engine test` | Run pdf-engine tests only |
| `pnpm --filter @document-flow/ui-library test` | Run ui-library tests only |
| `pnpm --filter @document-flow/pdf-engine test:watch` | Watch mode for pdf-engine |

---

## packages/pdf-engine

**Config:** `packages/pdf-engine/vitest.config.ts` (happy-dom, `src/**/*.test.ts`)

**Setup:** `src/test-setup.ts` defines a minimal `Worker` global so heic2any loads in Node (happy-dom does not provide `Worker`).

**Tests:** `src/document-processor.test.ts`

| Test | Description |
|------|-------------|
| **normalizeToPages** | Throws for unsupported file type (e.g. `.docx`), unknown extension |
| **normalizeToPages (PNG)** | *Skipped* in Node—Image/Blob loading does not behave like a real browser; use browser E2E to cover |
| **generateStapledPDF** | Throws when pages array is empty; returns valid PDF (starts with `%PDF-`) for single page; respects `order` across pages |

**Note:** `generateStapledPDF` tests use a mocked `canvas.toBlob` because happy-dom does not implement it. The mock provides a minimal valid PNG blob so `pdf-lib.embedPng` succeeds.

---

## packages/ui-library

**Config:** `packages/ui-library/vitest.config.ts`

**Tests:** `src/file-thumbnail.test.ts` (uses `@open-wc/testing`)

| Test | Description |
|------|-------------|
| Component definition | Element can be created with `document.createElement('file-thumbnail')` |
| Filename | Displays `filename` in the DOM |
| Empty preview | Shows "No preview" when `preview` is empty |
| Preview image | Shows `<img>` when `preview` is set |
| Rotate event | Dispatches `rotate` when "Rotate 90°" button is clicked |

---

## Adding Tests to Apps

To add tests to `apps/manual` or `apps/utility-v1`:

1. Add `"test": "vitest run"` and `"test:watch": "vitest"` to the app's `package.json`
2. Add `vitest.config.ts` (use happy-dom or jsdom)
3. Turbo will include the app when running `pnpm test`
