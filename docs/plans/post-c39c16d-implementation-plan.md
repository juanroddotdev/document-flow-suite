# Post-c39c16d Implementation Plan

**Baseline:** `c39c16d` — Step 4: Migrate to Lit + document-flow-app (keep main's layout) — DnD works

**Scope:** Phase A (implement now), Phase B (maybe next), Phase C (later)

---

## Phase A: Orders 1 & 2 — Implement & Verify

### Order 1: Refactor (3bbd0e5)

**What:** Extract ProcessingService, move helpers to app-state. No UI or DnD changes.

**Changes:**

1. **`apps/utility-v1/src/app-state.ts`**
   - Add helpers: `blobToPreviewDataUrl`, `blobToCanvas`, `rotateBlob90` (moved from document-flow-app)
   - Keep `PageState` with `canvas` for now (no Blob migration yet)

2. **`apps/utility-v1/src/services/processing-service.ts`** (new file)
   - `ProcessingService` class
   - `processFiles(files, getIdFn, onProgress?)` — uses pdf-engine, heic2any, browser-image-compression
   - Returns `PageState[]`

3. **`apps/utility-v1/src/components/document-flow-app.ts`**
   - Import ProcessingService and helpers from app-state
   - Replace inline processing logic with `ProcessingService.processFiles()`
   - Use helpers in rotate/export instead of inline `canvasToDataUrl`, `rotateCanvas90`
   - **Leave DnD, tabletop, template structure untouched**

**Verification checklist:**
- [ ] Add files (HEIC, PNG, PDF) — processing works
- [ ] Drag-and-drop reorder works
- [ ] Rotate and delete buttons work
- [ ] Export PDF — correct order, no errors

---

### Order 2: PR Template + Backlog (2d1acfa)

**What:** Docs-only. Add PR template and document backlog items.

**Changes:**

1. **PR template** — `.github/PULL_REQUEST_TEMPLATE.md` (or equivalent)
2. **Backlog doc** — Document: document islands, incremental upload, versioning (in `docs/backlog.md` or existing backlog)

**Verification:**
- [ ] No functional change; confirm DnD still works (optional quick sanity check)

---

## Phase B: Step 5 — Maybe Next

**What:** Switch to Blobs + worker for memory efficiency.

**When:** Implement after Phase A is verified and you want memory/performance improvements.

**Planned changes:**
- `PageState` stores `blob` instead of `canvas`
- Processing outputs Blobs; preview generated from Blob
- Offload heavy work to worker
- Export time: convert Blob → canvas before PDF generation

**Verification:** Same as Phase A; DnD must still work.

---

## Phase C: Step 6 & 7 — Later

**What:** Virtualization for scalability (50+ pages). DnD adapts to virtualized layout.

**When:** Defer until you have a clear need (large batches) and time to solve DnD + virtualization.

**Planned changes:**
- Virtualized grid: `getVisibleRange`, scroll/resize observers
- DnD wired for virtualized DOM (placeholder positioning, drop index from pointer)

**Note:** Previously broke DnD; consider using `@lit-labs/virtualizer` or dedicated spike before re-implementing.

---

## Execution Summary

| Step | Action | Test |
|------|--------|------|
| A1 | Implement refactor (3bbd0e5) | DnD + process + export |
| A2 | Implement PR template + backlog (2d1acfa) | Docs only; optional sanity check |
| — | **Stop and verify Phase A** | — |
| B | Step 5 (when ready) | DnD + process + export |
| C | Step 6 & 7 (when needed) | DnD + virtualization |
