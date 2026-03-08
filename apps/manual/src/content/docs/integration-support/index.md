---
title: Integration & Support
description: Implementation guide, browser extension, and contact/licensing.
---

## Implementation Guide

DocumentFlow Suite can be embedded as a **drop-in component** in client-facing websites (Phase 2). Users upload files, reorder and rotate them in the browser, and download an optimized PDF—without leaving your site.

### Steps

1. **Install the packages**

   ```bash
   pnpm add @document-flow/pdf-engine @document-flow/ui-library
   ```

2. **Import the PDF engine**

   ```ts
   import { DocumentProcessor } from '@document-flow/pdf-engine';
   const processor = new DocumentProcessor();
   ```

3. **Use the UI components** — Wire up a drop zone, pass files to `DocumentProcessor.normalizeToCanvas()`, collect pages, and call `generateStapledPDF()` for export.

### Requirements

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Phase 2 (Smart Gateway) uses Lit Web Components—compatible with React, Vue, Angular, or vanilla HTML

## Browser Extension

*Coming soon.* Use DocumentFlow as a workflow overlay—fix documents without leaving your current tab or application.

## Contact & Licensing

- **Getting Started:** Reach out for trial access and technical onboarding.
- **Technical Support Tiers:** Trial, Professional, and Enterprise support options available.
- **Licensing:** Per-seat or site-wide licensing depending on deployment.

*Contact details and licensing tiers to be published.*
