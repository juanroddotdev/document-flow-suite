---
title: Implementation Guide
description: How to drop the DocumentFlow component into existing sites (Phase 2).
---

## Overview

DocumentFlow Suite can be embedded as a **drop-in component** in client-facing websites. Users upload files, reorder and rotate them in the browser, and download an optimized PDF—without leaving your site.

## Integration Steps

1. **Install the packages**

   ```bash
   pnpm add @document-flow/pdf-engine @document-flow/ui-library
   ```

2. **Import the PDF engine**

   ```ts
   import { DocumentProcessor } from '@document-flow/pdf-engine';
   const processor = new DocumentProcessor();
   ```

3. **Use the UI components**

   ```html
   <script type="module" src="node_modules/@document-flow/ui-library/dist/index.js"></script>
   <file-thumbnail filename="scan.pdf" preview="/path/to/preview"></file-thumbnail>
   ```

4. **Wire up your drop zone** — Capture files from an `<input type="file">` or drag-and-drop, pass them to `DocumentProcessor.normalizeToCanvas()`, then collect pages and call `generateStapledPDF()` for export.

## Requirements

- **Phase 2 (Smart Gateway)** — Requires a supported framework (React, Vue, Lit, or vanilla JS)
- **Modern browsers** — Chrome, Firefox, Safari, Edge (latest)
- **HEIC support** — Relies on `heic2any`; Safari has native HEIC handling

## Limitations (v1.0)

- No server-side processing
- No .docx support
- No cloud storage integration
- Client-side only
