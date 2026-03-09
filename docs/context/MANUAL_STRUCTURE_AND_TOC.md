# Manual Structure and Table of Contents

Context document for DocumentFlow Suite: dual-manual strategy, master TOC, and external manual overview. Merged from Manual Structure for Product & Engineering, DocumentFlow External Manual Draft, and Dual Manual Structure For Project Completion.

---

## 1. Why a dual-manual structure

Splitting the manual into **Internal** and **External** creates two types of accountability and helps with completion:

- **Internal (Architect's Vault):** The "messy" but honest part—where you document hurdles, unfiltered to-dos, tech debt, legal/financial notes, and developer-only details. No pressure to sound professional.
- **External (Product Suite):** What you share with stakeholders, buyers, or the community. Polished, clear, confident—ROI, privacy/security, integration guides, and value proposition.

**Benefits:**

- **Psychology:** Having an Internal space lets you be imperfect while the External manual stays presentable.
- **Clear boundaries:** Avoid accidentally sharing confidential information.
- **Momentum:** Finishing a technical feat in Internal gives the satisfaction of "promoting" it to External—a concrete win.

**Implementation:** Use "private folders" in Starlight/VitePress that don't publish, or keep the Internal manual in a private Obsidian/Notion vault and host only the External manual on the web.

---

## 2. Master table of contents

Headers are written for decision-makers (solution to their problems), not as "dev speak." The External manual should read like a product marketing site; the Internal manual like an Engineering Blueprints folder.

### Part 1: The External Manual (The Product Suite)

**Target audience:** Clients, stakeholders, decision-makers.

| Section | Contents |
|--------|----------|
| **1. Product Overview** | Solution summary (messy uploads → standardized PDFs); key benefits (efficiency, privacy, cost savings); core features (agnostic file handling, visual reordering, auto-optimization). |
| **2. The Business Case** | Cost comparison (Adobe vs. DocumentFlow); ROI calculator; workflow impact (reducing back-and-forth over bad files). |
| **3. Privacy & Compliance** | Zero-Server Processing; compliance (HIPAA, SOC2); Data Security FAQ for IT. |
| **4. Integration & Support** | Implementation guide (dropping the component into an existing site); browser extension; contact and licensing / support tiers. |

### Part 2: The Internal Manual (The Architect's Vault)

**Target audience:** Founder / lead developer.

| Section | Contents |
|--------|----------|
| **1. Project Governance** | Legal shielding (LLC, IP ownership); employment review (moonlighting checks, contract clauses); Feature Freeze and Definition of Done for v1.0. |
| **2. Engineering Blueprints** | Normalization pipeline (HEIC/TIFF/PDF specs); monorepo structure (pnpm workspace map); memory guardrails (browser RAM limits). |
| **3. Development Operations (DevOps)** | Deployment pipeline (manual and app); backend orchestration (Supabase schema, Auth, API routes); tech debt log. |
| **4. Business Strategy & Outreach** | "Company B" list; pitch scripts (e.g. cold outreach templates); pricing strategy (trial vs. enterprise). |

---

## 3. Phase 1: Minimum Viable Manual

To avoid overwhelm, use a **"Phase 1: Minimum Viable Manual"** marker: don't fill every page before starting. Fill only the **"Core 3"** in each section to get the foundation solid. Small wins (e.g. completing the Product Overview) are possible even before heavy technical work (e.g. Memory Guardrails) is done.

---

## 4. External manual draft: Project overview

*First official draft for the External Manual—professional, public-facing.*

### 4.1 DocumentFlow Suite at a glance

A high-performance, **privacy-first** utility that bridges "Raw Customer Uploads" and "Record-Ready Documents." File normalization and optimization run in the browser, eliminating expensive desktop software and high-latency server processing.

### 4.2 The problem: the "Friction Tax"

- **Format fatigue:** HEIC (iPhone), TIFF, massive JPEGs.
- **Manual cleanup:** Staff rotate, reorder, and shrink files in Adobe Acrobat.
- **Licensing overhead:** Enterprise licenses for simple document "stapling" become a cost center.

### 4.3 The solution: agnostic document triage

- **Format agnostic:** Mobile photos to legacy fax formats.
- **Zero-Server Processing:** Data stays in the user's RAM; sensitive data never leaves the machine (HIPAA-friendly).
- **Auto-optimization:** Standard 150 DPI; files small enough for storage, crisp enough for legal records.

### 4.4 Strategic roadmap (Inside-Out)

| Phase | Milestone | Focus |
|-------|-----------|--------|
| 1 | Internal Utility | Power-tool for employees to fix "bad" files in seconds. |
| 2 | Intelligent Gateway | Client-facing portal that fixes files during upload. |
| 3 | Field Mobility | Touch-optimized UI for agents and contractors. |

### 4.5 Core capabilities

- **Intelligent stitching:** Merge multiple file types into one linearized PDF.
- **Visual reordering:** Drag-and-drop "tabletop" to fix page order.
- **Instant normalization:** Auto-correction of orientation (sideways/upside-down).
- **Legacy support:** Adapters for TIFF and BMP common in financial services.

---

*Source docx: Manual Structure for Product & Engineering, DocumentFlow External Manual Draft, Dual Manual Structure For Project Completion.*
