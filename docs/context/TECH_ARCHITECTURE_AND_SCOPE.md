---
title: Tech Architecture and Scope
description: Zero-debt stack, monorepo, Definition of Done, and setup.
---

# Tech Architecture and Scope

Context document for DocumentFlow Suite: zero-debt stack, monorepo structure, Definition of Done, and setup. Merged from Tech Stack for Document Flow Suite, Zero-Debt Full Stack Architecture, Defining Project Scope and Architecture, Internal Manual Technical Architecture, and Setting Up Your Monorepo Foundation.

---

## 1. Design principles

- **Modular, "debt-free" suite** usable at work and sellable to others. The gold standard is a **Monorepo** (one repo, multiple packages): Manual, Components, and Apps separate but synced.
- **Client-Side First:** The backend stays lean—User Auth, Metadata Storage, and API layers. Processing runs in the user's browser.
- **Completion-proof:** First weekend is about **setting up the house** so that when you code, friction is zero. Stand up the structure before writing PDF stapling logic.

---

## 2. The zero-debt tech stack

### 2.1 Foundation: monorepo tooling

| Layer | Technology | Why |
|-------|------------|-----|
| Package manager | **pnpm** | Faster; content-addressable store (shared deps stored once). |
| Build orchestrator | **Turborepo** | Caches builds; changing the manual doesn't recompile the PDF engine. |

### 2.2 Manual

| Layer | Technology | Why |
|-------|------------|-----|
| Docs | **Starlight (Astro)** | Framework-agnostic; embed React, Vue, Lit on different pages. Content is Markdown; host anywhere. |

### 2.3 Components

| Layer | Technology | Why |
|-------|------------|-----|
| UI | **Lit (Web Components)** | Native; works in any framework or legacy HTML. Ensures buyers can use the tool regardless of their stack. |

### 2.4 Logic (the engine)

| Concern | Technology | Why |
|---------|------------|-----|
| PDF manipulation | **pdf-lib** | Client-side byte-level control. |
| Image processing | **heic2any** + **browser-image-compression** | HEIC/HEIF and DPI scaling. |
| Threading | **Comlink** | Heavy image crunching in a background thread so the UI doesn't freeze. |

### 2.5 Backend (BaaS)

| Layer | Technology | Why |
|-------|------------|-----|
| Database & Auth | **Supabase** | PostgreSQL, RLS, user logins, file metadata. Exportable to any Postgres. |
| API | **Hono** | 14KB; runs on Edge (e.g. Cloudflare Workers). License keys, emails, etc. |
| Storage | **Supabase Storage** or **Cloudflare R2** | For "Save to Cloud" when needed. |

**Why this backend fits a side business:** Free tiers are generous; RLS simplifies compliance; portability (new owner takes repo + Supabase project).

---

## 3. Project map (folder structure)

Two variants are documented; the codebase may use one or a mix.

**Variant A (apps-focused):**

```
/document-flow-suite
├── /apps
│   ├── /manual          ← [Starlight] How-to & Sales site
│   └── /utility-web     ← [Vite] Standalone converter site
├── /packages
│   ├── /ui-components  ← [Lit] Tabletop, rotate buttons, etc.
│   ├── /pdf-engine      ← [Vanilla TS] Core logic (no UI)
│   └── /shared-configs ← [TS/ESLint] Shared rules
├── package.json
└── turbo.json
```

**Variant B (with dashboard/API):**

```
/document-flow-suite
├── /apps
│   ├── /manual    ← [Starlight] Markdown docs & Sales site
│   ├── /dashboard ← [Next.js] License key management
│   └── /api       ← [Hono] Auth & Billing
├── /packages
│   ├── /ui-components   ← [Lit]
│   ├── /pdf-engine       ← [Vanilla TS] Image-to-PDF logic
│   └── /database-schema ← [Supabase] SQL definitions & migrations
├── pnpm-workspace.yaml
└── turbo.json
```

**Internal Manual variant (utility-v1, ui-library):**

```
/apps/manual, /apps/utility-v1 (Vite + TS)
/packages/pdf-engine, /packages/ui-library, /packages/shared-configs
turbo.json, pnpm-workspace.yaml
```

---

## 4. Agnostic pipeline flow (internal logic)

Strict data flow so v1.0 stays stable. **No raw files touch the Stapler directly**; they go through the Normalizer.

1. **Ingestion:** User drops a file (HEIC, TIFF, PNG, etc.).
2. **Normalization:** A Worker converts the file into a standardized Bitmap/Canvas object.
3. **State:** The app keeps a list of these objects in the "Tabletop" state.
4. **Transformation:** Rotate/Reorder update object metadata in state.
5. **Composition:** On export, pdf-engine takes the objects, applies transformations, and paints them into the final PDF.

---

## 5. Definition of done (version 1.0)

Version 1.0 is strictly an **Internal Employee Utility**. Phase 2 (Client-Facing) starts only when the below are met 100%.

### I. Agnostic pipeline requirements

- **Formats:** JPEG, PNG, HEIC (iPhone), single-page TIFF—ingest and normalize without crashing the browser.
- **Normalization:** Every input → standard Canvas object.
- **Rotation:** User can rotate any page in 90° increments.
- **Optimization:** Stapler output: images downsampled to **150 DPI**.

### II. Tabletop UI (v1.0)

- **Drop zone:** Drag 10+ mixed-format files at once.
- **Visual sort:** Drag thumbnails to change order in the final PDF.
- **Delete:** Remove a bad page (e.g. blurry photo) before merge.
- **Export:** Single click → generate PDF → browser download.

### III. Performance benchmarks

- **Memory:** Process 20 high-res mobile photos (~5MB each) on 8GB RAM without "Page Unresponsive."
- **Speed:** Final PDF generation &lt; 10 seconds after "Export" is clicked.

### IV. Personal success milestone

- **Proof of life:** Staple a sideways HEIC and a vertical PNG into one upright, 2-page PDF.
- **Reward:** [Insert your reward, e.g. new keyboard or weekend off-grid.]

---

## 6. Internal guardrails (explicitly out of scope for v1.0)

- **No cloud saving:** Download-only; no Supabase storage yet.
- **No AI/OCR:** No automatic text reading or form-filling.
- **No mobile-first UI:** Works on tablet, but v1.0 is desktop (employee workstation).
- **No user accounts:** Single License Key or IP/Domain restriction to keep Auth simple.

Documenting these exclusions gives permission to ignore "cool ideas" (e.g. "email the PDF") until Phase 2.

---

## 7. Dependency guardrails

Libraries must be documented here. Core set:

- **PDF:** pdf-lib (low-level, client-side).
- **Images:** heic2any (Apple formats), canvas API (browser scaling).
- **UI:** Lit (portable to any framework in Phase 2).

---

## 8. Technical debt log ("do not fix yet" for v1.0)

- **Local state only:** Refresh = lose progress. (Fix in Phase 2 with Supabase/LocalDB.)
- **Synchronous processing:** Start single-thread; move to Web Workers only if 50+ images cause lag.
- **Minimalist styling:** System fonts + e.g. Tailwind to avoid custom CSS sprawl.

---

## 9. Weekend one: the foundation checklist

### Saturday morning: clean room

- [ ] **Digital perimeter:** New private GitHub account/org with personal email (not day-job).
- [ ] **Environment:** Node.js (LTS), pnpm. Run: `corepack enable pnpm`
- [ ] **Rewards:** Write down the reward for finishing this weekend.

### Saturday afternoon: monorepo shell

- [ ] Initialize project and workspace; create `/apps` and `/packages`.
- [ ] Install Turborepo.
- [ ] "Proof of life" commit: push empty shell to private GitHub.

### Sunday morning: the manual (Starlight)

- [ ] Initialize Starlight in `/apps/manual`.
- [ ] Create first four External Manual pages (Overview, Security, ROI, Integration).
- [ ] Create Internal Vault (repo folder or Obsidian); copy Definition of Done, Legal Shield, Tech Stack.

### Sunday afternoon: first entry

- [ ] Technical audit: 30 minutes reading pdf-lib docs (no code yet).
- [ ] Monday morning note: One sentence in Internal Manual for where to start next (e.g. "Next session: Create /packages/pdf-engine and install dependencies.").

**Why this works:** By end of Sunday you have a live Manual and a scalable monorepo. You can alternate between code and Manual to keep momentum.

---

## 10. Why this structure prevents "the wall"

Different "rooms" to work in: if you're bored with UI, work on the Engine; if the Engine is heavy, switch to Manual or UI Library. Overall momentum is preserved.

---

*Source docx: Tech Stack for Document Flow Suite, Zero-Debt Full Stack Architecture, Defining Project Scope and Architecture, Internal Manual Technical Architecture Overview, Setting Up Your Monorepo Foundation.*
