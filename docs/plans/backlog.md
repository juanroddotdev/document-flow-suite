# Backlog

Derived from [Scalability & Architecture Review](../../analysis_results.md) (repo root). Items are grouped by priority.

---

## Should do (high impact, near-term)

| # | Item | Why |
|---|------|-----|
| 1 | **Offload heavy work to Web Workers** ✓ Done | HEIC/TIFF/PDF work on the main thread freezes the UI (e.g. 50 HEIC files). Move `normalizeHeic`, `normalizeTiff`, and PDF generation into workers (e.g. with Comlink). *TIFF/PDF/raster run in worker; HEIC stays on main (heic2any requires DOM).* |
| 2 | **Memory: Blobs instead of live Canvases** ✓ Done | Storing unbounded `HTMLCanvasElement`s in `PageState[]` leads to OOM with many pages. Store normalized pages as **Blob**s; use Canvases only for visible thumbnails and revoke blob URLs when done. |
| 3 | **Thumbnail virtualization / lazy loading** | Only create thumbnails for visible items so memory and DOM stay bounded as page count grows. |
| 4 | **Replace imperative main.ts with Lit (or component app)** | ~470 lines of manual DOM in `main.ts` will not scale. Migrate to a Lit app (or Preact/React if you prefer) so you can add rotation, cropping, per-file progress, etc. without a monolith. |
| 5 | **Structured error handling** ✓ Done | Replace “log and forget” with clear error types and user-facing messages so you can debug and Phase 2 can show “why” something failed. |

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
| 12 | **Document islands for multi-file uploads** | When multiple PDFs or multi-page files are uploaded, render each file as its own draggable block ("island") on the tabletop instead of flattening into one list. Reorder pages within each island; reorder islands to set merge order. Final export merges all islands into one PDF. Scope: all multi-page types. Single-file uploads treated as single-page islands for consistency. Cross-island page moves: no (add later if needed). |
| 13 | **Incremental upload with Add card** | Currently the file picker only works when the tabletop is empty; once there are pages, clicking does nothing. Allow users to add more files anytime. Add a plus/add card after the last thumbnail so users can click to add more without starting over. |
| 14 | **Lightweight structure-only versioning** | Store only page IDs and order for checkpoints (e.g. after upload, before bulk delete, or on user action). Cap history (e.g. 5-10 versions). Allows reverting structure without duplicating blobs. |
| 15 | **Banner/toast for success and error messages** | Replace or supplement inline error banner with a reliable toast or floating notification so users consistently see processing/export success and failure feedback. |

---

## Polish / UX (Phase 1 refinement)

| # | Item | Why |
|---|------|-----|
| 19 | **Page count display** | Show "12 pages" in sidebar or header so users see how many pages they have. |
| 20 | **Success toast after export** | Replace or supplement "Download Started!" with a short toast (ties into #15). |
| 21 | **Keyboard shortcuts** | Delete to remove selected page; Escape to cancel drag. |
| 22 | **Export progress** | For large batches, show progress during PDF generation. |
| 23 | **Clear drag affordance** | Make it obvious what is draggable (e.g. drag handle vs whole card). |
| 24 | **Mobile touch targets** | Ensure rotate/delete and Add card are large enough on touch devices. |
| 25 | **Empty tabletop drop hint** | When dragging over empty tabletop, show "Drop to add files" or similar. |

---

## Maybe (optional or context-dependent)

| # | Item | Why |
|---|------|-----|
| 16 | **Use Preact/React instead of Lit** | Only if the team strongly prefers JSX and is okay adding that dependency; Lit already fits the stack and “framework-agnostic” goal. |
| 17 | **Exact IndexedDB wrapper** | Choice of localforage vs idb-keyval vs raw IndexedDB is an implementation detail once you commit to session persistence. |
| 18 | **Hard cap on file size (e.g. 100MB)** | Pre-flight can warn; whether to block or only warn depends on product and user expectations. |

---

## Suggested order

1. ~~**First:** #1 (Workers) + #2/#3 (Blobs + virtualization)~~ ✓ #1 and #2 done (PR #20). #3 (virtualization) deferred.
2. ~~**Then:** #4 (Lit app) + #5 (errors)~~ ✓ Both done (PR #20, #21).
3. **Phase 1 polish:** #13 (incremental upload), #15 (banner/toast), #19–#25 (Polish/UX).
4. **When moving toward Phase 2:** #7, #8, #9, #10, #11, #12, #14 (session, queue, API, pre-flight, telemetry, document islands, structure versioning).
5. **When refining state:** #6 (state machine/store).

---

## GitHub issues

| Plan # | Priority       | Issue |
|--------|----------------|-------|
| 1      | Should do ✓    | [#5 Offload heavy work to Web Workers](https://github.com/juanroddotdev/document-flow-suite/issues/5) — PR #20 |
| 2      | Should do ✓    | [#6 Memory: Blobs instead of live Canvases](https://github.com/juanroddotdev/document-flow-suite/issues/6) — PR #20 |
| 3      | Should do      | [#7 Thumbnail virtualization / lazy loading](https://github.com/juanroddotdev/document-flow-suite/issues/7) |
| 4      | Should do      | [#8 Replace imperative main.ts with Lit](https://github.com/juanroddotdev/document-flow-suite/issues/8) |
| 5      | Should do ✓    | [#9 Structured error handling](https://github.com/juanroddotdev/document-flow-suite/issues/9) — PR #21 |
| 6      | Do eventually  | [#10 State machine or state store](https://github.com/juanroddotdev/document-flow-suite/issues/10) |
| 7      | Do eventually  | [#11 Session persistence (IndexedDB)](https://github.com/juanroddotdev/document-flow-suite/issues/11) |
| 8      | Do eventually  | [#12 Job queue + per-file progress](https://github.com/juanroddotdev/document-flow-suite/issues/12) |
| 9      | Do eventually  | [#13 Phase 2 API hand-off](https://github.com/juanroddotdev/document-flow-suite/issues/13) |
| 10     | Do eventually  | [#14 Smart pre-flight validation](https://github.com/juanroddotdev/document-flow-suite/issues/14) |
| 11     | Do eventually  | [#15 Privacy-preserving telemetry](https://github.com/juanroddotdev/document-flow-suite/issues/15) |
| 12     | Do eventually  | Document islands for multi-file uploads *(create GitHub issue when ready)* |
| 13     | Do eventually  | Incremental upload with Add card *(create GitHub issue when ready)* |
| 14     | Do eventually  | Lightweight structure-only versioning *(create GitHub issue when ready)* |
| 15     | Do eventually  | Banner/toast for success and error messages *(create GitHub issue when ready)* |
| 16     | Maybe          | [#16 Consider Preact/React instead of Lit](https://github.com/juanroddotdev/document-flow-suite/issues/16) |
| 17     | Maybe          | [#17 Choose IndexedDB wrapper](https://github.com/juanroddotdev/document-flow-suite/issues/17) |
| 18     | Maybe          | [#18 Hard cap on file size](https://github.com/juanroddotdev/document-flow-suite/issues/18) |
| 19     | Polish/UX      | Page count display *(create GitHub issue when ready)* |
| 20     | Polish/UX      | Success toast after export *(create GitHub issue when ready)* |
| 21     | Polish/UX      | Keyboard shortcuts *(create GitHub issue when ready)* |
| 22     | Polish/UX      | Export progress *(create GitHub issue when ready)* |
| 23     | Polish/UX      | Clear drag affordance *(create GitHub issue when ready)* |
| 24     | Polish/UX      | Mobile touch targets *(create GitHub issue when ready)* |
| 25     | Polish/UX      | Empty tabletop drop hint *(create GitHub issue when ready)* |

**Labels:** `analysis-todo` plus `priority: should-do` | `priority: eventually` | `priority: maybe` | `priority: polish`.
