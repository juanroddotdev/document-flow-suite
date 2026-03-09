---
title: Agnostic Input Pipeline
description: Input tiers, normalization strategy, and feature freeze.
---

# Agnostic Input Pipeline

Context document for DocumentFlow Suite: input tiers, normalization strategy, and feature freeze. Merged from Agnostic Input Pipeline Strategy.

---

## 1. Core requirement

For a professional **Agnostic Utility**, Agnostic Input is not one feature among many—it is the **core requirement**. The Definition of Done standard: *If a standard browser can read it, or it's a common mobile/office format, the tool must handle it.*

Being specific about HEIC was to highlight a hard technical hurdle; the product standard is category-based, not a long list of extensions.

---

## 2. Feature freeze: the agnostic standard

Define **Input Tiers** in the manual instead of chasing individual file types. This makes the plan completion-proof: you build a **Pipeline** that handles categories.

| Tier | Category | Target formats | Goal |
|------|----------|----------------|------|
| **Tier 1** | Native Web | JPEG, PNG, WebP, SVG | Zero conversion; direct to PDF. |
| **Tier 2** | Mobile-First | HEIC, HEIF, Portrait Modes | Auto-convert to JPEG/PNG in a Web Worker. |
| **Tier 3** | Legacy Office | TIFF, BMP | Binary-level conversion to standard raster. |
| **Tier 4** | Document Core | PDF | Re-fry or merge existing PDFs. |

**Rule:** Feature Freeze for v1.0 means **no non-visual files** (.docx, .xlsx). Those need a heavy server-side engine (e.g. LibreOffice) and break the Client-Side / low-cost model. We stick to **Visual Document Triage** only.

---

## 3. Why tiers protect from "the wall"

- Build the **Pipeline once**.
- Any new "weird" image type later becomes a new **Adapter** plugged into the same Pipeline.
- UI and PDF logic stay unchanged.

---

## 4. Normalization strategy (manual text)

Under Technical Architecture, add a page **"The Normalization Strategy"** with wording like:

> To ensure 100% completion and zero tech debt, the tool uses a **Uniform Intermediate Format**. No matter what the user drops in—a 48-bit TIFF or a 20MB HEIC—the engine immediately converts it to a standard **Canvas Object** in memory. This Canvas is what the user rotates, reorders, and eventually staples into the final PDF. Rotation and Merging code is written once.

---

## 5. Completion-proof milestone: the universal dropzone

**Milestone 1** proof is not a pretty PDF; it is:

- **Test:** Drop 5 different file types (.jpg, .png, .heic, .tiff, .pdf).
- **Success:** All 5 appear as identical-looking thumbnails on the screen.

If that works, the rest is largely UI polish.

---

## 6. Performance: virtual list

For the agnostic goal, if a user drops 50 files, the app must not crash the browser. The manual should include a **Virtual List** strategy: even with 100 pages, only render the 5 visible on screen.

---

*Source docx: Agnostic Input Pipeline Strategy.*
