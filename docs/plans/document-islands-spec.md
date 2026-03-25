# Document islands — product spec (extended)

**Status:** Draft — extends [backlog #12](backlog.md) (document islands) with user-defined grouping and dual export.  
**Aligns with:** [FULL_PROJECT_MANIFESTO.md](../context/FULL_PROJECT_MANIFESTO.md) — processing stays in the browser; no document uploads to a server.

---

## 1. Purpose

Give users **packages** (“islands”) of pages they can **name, merge, split, and reorder**, then **export either one combined PDF or one PDF per package** — without changing the agnostic normalization + stapling pipeline.

---

## 2. Definitions

| Term | Meaning |
|------|---------|
| **Island** | An ordered list of **pages** (`PageState`-like entries) that acts as one **logical package** for export and UI. |
| **Page** | A single normalized page (blob + preview + metadata), as today. |
| **Merge islands** | Concatenate two or more islands’ pages into **one** island (optional: drop empty sources). |

---

## 3. Default behavior on upload

- Each **PDF (or multi-page file)** uploaded becomes **at least one island** by default — typically **one island per source file**, containing that file’s pages in order.
- **Single-page / single-file** uploads can remain **one island with one page** so the user does **not** have to combine anything.
- **Incremental adds** (e.g. Add card) create **new islands** or append per product decision; default: **new file → new island**.

---

## 4. User operations (must support)

| Operation | Description |
|-----------|-------------|
| **Reorder pages inside an island** | Same as today’s thumbnail reorder, scoped to that island. |
| **Reorder islands** | Changes **merge order** when exporting a single combined PDF. |
| **Move page(s) between islands** | User can reorganize which page belongs to which package. |
| **Combine files into one island** | Merge sources (e.g. drag pages, or “merge island A into B”, or multi-select + group). |
| **Combine already-grouped islands** | **Merge island** — two or more islands become one ordered stack. |
| **Leave singles uncombined** | A one-page island is valid; no forced merge. |

*Cross-island moves and merge-island actions go beyond the minimal backlog #12 note (“no cross-island at first”); they are **required** for this spec.*

---

## 5. Export

User chooses **at export time** (or via clear primary/secondary actions):

| Mode | Behavior |
|------|----------|
| **Merged PDF** | One stapled PDF: walk **islands in order**, then **pages in order** within each island. |
| **Individual PDFs** | One stapled PDF **per island** (packages are the unit of “individual”). Use when the user grouped pages into separate deliverables. *Optional later: ZIP of multiple PDFs in one action.* |

Engine: existing client-side `generateStapledPDF` / blob flow; **N exports** for individual mode, **1 export** for merged mode.

---

## 6. Non-goals (this spec)

- Server-side document processing or storage.
- Cross-island semantics for **original filename** once pages are merged (display can show “mixed” or primary label — product decision).
- Phase 2 intake API — hand-off is the same **Blob(s)** as today.

---

## 7. Implementation sketch (for planning only)

- **State:** `Island[]` with `{ id, label?, pages: PageState[] }` (or equivalent normalized model).
- **UI:** Tabletop shows **one block per island** (header + thumbnails); island-level drag for order; page-level drag within and **between** islands when implemented.
- **DnD:** Extend or duplicate thumbnail controller patterns for **scoped lists** + **cross-island** drop targets.

---

## 8. Relation to backlog

- [Backlog #12](backlog.md) — **#12** introduced islands and single merged export; **this spec** adds **user grouping**, **cross-island moves**, **merge islands**, and **merged vs individual export**.

When implementation starts, add or update a GitHub issue and link it here.
