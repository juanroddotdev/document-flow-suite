# Analysis Todo Plan

Derived from [Scalability & Architecture Review](../../analysis_results.md) (repo root). Items are grouped by priority.

---

## Should do (high impact, near-term)

| # | Item | Why |
|---|------|-----|
| 1 | **Offload heavy work to Web Workers** | HEIC/TIFF/PDF work on the main thread freezes the UI (e.g. 50 HEIC files). Move `normalizeHeic`, `normalizeTiff`, and PDF generation into workers (e.g. with Comlink). |
| 2 | **Memory: Blobs instead of live Canvases** | Storing unbounded `HTMLCanvasElement`s in `PageState[]` leads to OOM with many pages. Store normalized pages as **Blob**s; use Canvases only for visible thumbnails and revoke blob URLs when done. |
| 3 | **Thumbnail virtualization / lazy loading** | Only create thumbnails for visible items so memory and DOM stay bounded as page count grows. |
| 4 | **Replace imperative main.ts with Lit (or component app)** | ~470 lines of manual DOM in `main.ts` will not scale. Migrate to a Lit app (or Preact/React if you prefer) so you can add rotation, cropping, per-file progress, etc. without a monolith. |
| 5 | **Structured error handling** | Replace “log and forget” with clear error types and user-facing messages so you can debug and Phase 2 can show “why” something failed. |

---

## Do eventually (important, Phase 2 or when scaling)

| # | Item | Why |
|---|------|-----|
| 6 | **State machine or state store** | Use something like XState or Zustand for Idle → Reading → Processing → Error/Ready → Exporting so flows stay predictable as features grow. |
| 7 | **Session persistence (IndexedDB)** | Avoid losing 10+ minutes of work on refresh/crash. Persist session + processed blobs locally (e.g. localforage/idb-keyval) and add “Restore previous session?” on reopen. |
| 8 | **Job queue + per-file progress** | Replace one global progress bar with a queue: show skeleton thumbnails immediately, process 2–3 files in parallel in workers, show a small spinner/progress per thumbnail. |
| 9 | **Phase 2 API hand-off** | When moving to client intake: produce the final PDF Blob and POST it to your API (e.g. presigned URL) instead of only offering download. |
| 10 | **Smart pre-flight validation** | Before processing: reject 0-byte files, detect password-protected PDFs and prompt early, optionally warn on very large files (e.g. >100MB). |
| 11 | **Privacy-preserving telemetry** | When you need to understand client-side failures (e.g. “Grandma’s corrupt PDF”), add something like Sentry with strict PII scrubbing so you see *why* and *where* it failed, not document content. |

---

## Maybe (optional or context-dependent)

| # | Item | Why |
|---|------|-----|
| 12 | **Use Preact/React instead of Lit** | Only if the team strongly prefers JSX and is okay adding that dependency; Lit already fits the stack and “framework-agnostic” goal. |
| 13 | **Exact IndexedDB wrapper** | Choice of localforage vs idb-keyval vs raw IndexedDB is an implementation detail once you commit to session persistence. |
| 14 | **Hard cap on file size (e.g. 100MB)** | Pre-flight can warn; whether to block or only warn depends on product and user expectations. |

---

## Suggested order

1. **First:** #1 (Workers) + #2/#3 (Blobs + virtualization) — fixes freezing and OOM.
2. **Then:** #4 (Lit app) + #5 (errors) — maintainability and debuggability.
3. **When moving toward Phase 2:** #7, #8, #9, #10, #11 (session, queue, API, pre-flight, telemetry).
4. **When refining state:** #6 (state machine/store).

---

## GitHub issues

| Plan # | Priority       | Issue |
|--------|----------------|-------|
| 1      | Should do      | [#5 Offload heavy work to Web Workers](https://github.com/juanroddotdev/document-flow-suite/issues/5) |
| 2      | Should do      | [#6 Memory: Blobs instead of live Canvases](https://github.com/juanroddotdev/document-flow-suite/issues/6) |
| 3      | Should do      | [#7 Thumbnail virtualization / lazy loading](https://github.com/juanroddotdev/document-flow-suite/issues/7) |
| 4      | Should do      | [#8 Replace imperative main.ts with Lit](https://github.com/juanroddotdev/document-flow-suite/issues/8) |
| 5      | Should do      | [#9 Structured error handling](https://github.com/juanroddotdev/document-flow-suite/issues/9) |
| 6      | Do eventually  | [#10 State machine or state store](https://github.com/juanroddotdev/document-flow-suite/issues/10) |
| 7      | Do eventually  | [#11 Session persistence (IndexedDB)](https://github.com/juanroddotdev/document-flow-suite/issues/11) |
| 8      | Do eventually  | [#12 Job queue + per-file progress](https://github.com/juanroddotdev/document-flow-suite/issues/12) |
| 9      | Do eventually  | [#13 Phase 2 API hand-off](https://github.com/juanroddotdev/document-flow-suite/issues/13) |
| 10     | Do eventually  | [#14 Smart pre-flight validation](https://github.com/juanroddotdev/document-flow-suite/issues/14) |
| 11     | Do eventually  | [#15 Privacy-preserving telemetry](https://github.com/juanroddotdev/document-flow-suite/issues/15) |
| 12     | Maybe          | [#16 Consider Preact/React instead of Lit](https://github.com/juanroddotdev/document-flow-suite/issues/16) |
| 13     | Maybe          | [#17 Choose IndexedDB wrapper](https://github.com/juanroddotdev/document-flow-suite/issues/17) |
| 14     | Maybe          | [#18 Hard cap on file size](https://github.com/juanroddotdev/document-flow-suite/issues/18) |

**Labels:** `analysis-todo` plus `priority: should-do` | `priority: eventually` | `priority: maybe`.
