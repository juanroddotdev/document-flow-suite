# Post-c39c16d Implementation Roadmap

**Current baseline:** `c39c16d` – Step 4: Migrate to Lit + document-flow-app (keep main's layout)

This doc captures what was done after that commit so we can re-implement it incrementally and verify DnD at each step.

---

## What Was Done (in order)

### 1. `3bbd0e5` – Refactor: extract ProcessingService, move helpers to app-state (Option A)
- Extracted `ProcessingService` class for file processing
- Moved helpers (blobToPreviewDataUrl, blobToCanvas, rotateBlob90, etc.) into `app-state.ts`
- Minor refactor of `document-flow-app.ts` to use the service

**Risk:** Low. Structural only; DnD unchanged.

---

### 2. `ad97be1` – Step 5: Switch to Blobs + worker
- Switched from in-memory canvases to Blobs for page storage
- Added worker usage for heavier processing (if applicable)
- `PageState` now stores `blob` instead of `canvas`
- PDF export converts blobs → canvases at export time

**Risk:** Low–medium. Changes data flow but not UI/DnD structure.

---

### 3. `2d1acfa` – Add PR template and backlog items
- Added PR template
- Documented backlog items: document islands, incremental upload, versioning

**Risk:** None. Docs/config only.

---

### 4. `0f225c7` – Step 6 & 7: Virtualization + DnD fix (PARKED – broke DnD)
- **Step 6 – Virtualization:**
  - Replaced full grid with virtualized layout
  - Scroll container, spacer, `#thumbnails-visible`, `#thumbnails-inner`
  - Only visible thumbnails rendered via `getVisibleRange`
  - Each thumbnail `position: absolute`; `updateVisibleThumbnails` on scroll/resize
  - `isDragging` flag to skip updates during drag
- **Step 7 – DnD adjustments:**
  - Placeholder positioned with `setPlaceholderPosition(dropIndex)`
  - `handleDragOver` uses `closest('[data-index]')` and `getDropIndexFromPointer` for empty areas
  - Single drop handler on `#thumbnails-inner`
  - In `file-thumbnail`: `draggable="false"` on `<img>`; `pointer-events` only on action buttons

**Outcome:** DnD stopped working (no dragstart/dragover/drop logs). Root cause not fully identified; `pointer-events` and `draggable="false"` on the img were suspected but fixes did not restore DnD.

---

## Suggested Re-implementation Order

1. **Refactor (3bbd0e5)** – Extract ProcessingService, move helpers
2. **Step 5 (ad97be1)** – Blobs + worker
3. **Docs (2d1acfa)** – PR template and backlog items
4. **Step 6 & 7** – Defer until DnD behavior on non-virtualized layout is solid. Consider:
   - Implementing virtualization first and keeping a simple, non-virtualized DnD path for testing
   - Or tackling virtualization and DnD in smaller, verifiable steps

---

## Verification Checklist (run after each step)

- [ ] DnD reorder works (drag thumbnail, drop on another)
- [ ] Placeholder appears during drag
- [ ] Rotate and delete buttons work
- [ ] Export PDF produces correct order
- [ ] No console errors
