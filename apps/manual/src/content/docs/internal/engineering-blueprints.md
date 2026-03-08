---
title: Engineering Blueprints
description: Normalization pipeline, monorepo structure, and memory guardrails. Architect's Vault.
sidebar:
  badge:
    text: Internal
    variant: caution
---

## The Normalization Pipeline

**Input → Normalize → Optimize → Output**

- **Input:** Client uploads (HEIC, JPEG, TIFF, PNG, PDF) via mobile or desktop.
- **Normalization:** Convert the file to a standard in-memory **Canvas object** (pdf-lib, heic2any, browser-image-compression).
- **Optimization:** 150-DPI downsampling for web-ready viewing.
- **Output:** A perfect, upright PDF.

### Tech Specs

- **Tier 1 (Native):** JPG, PNG
- **Tier 2 (Mobile):** HEIC, HEIF
- **Tier 3 (Legacy):** TIFF, BMP
- **Tier 4 (PDF):** Existing PDFs for re-processing/merging

## Monorepo Structure

```
document-flow-suite/
├── apps/
│   ├── manual/          # Starlight (Astro) docs
│   └── utility-v1/      # Vite + Tailwind employee tool
├── packages/
│   ├── pdf-engine/      # Core logic (pdf-lib, heic2any)
│   └── ui-library/      # Lit Web Components
├── docs/
│   └── context/         # Manifesto, internal notes
├── pnpm-workspace.yaml
└── turbo.json
```

- **Linking:** Internal deps use `workspace:*`
- **Build order:** `turbo run build` respects `^build` dependency graph

## Memory Guardrails

Heavy processing (many large HEICs, TIFFs) can push browser RAM limits. Strategies:

- **Chunked processing:** Process files in batches to avoid OOM.
- **Canvas disposal:** Release canvas references when done to allow GC.
- **User guidance:** Warn when adding many large files; suggest smaller batches.
