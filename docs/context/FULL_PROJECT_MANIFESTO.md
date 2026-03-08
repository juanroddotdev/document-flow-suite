# DocumentFlow Suite — Full Project Manifesto

## I. The Strategic Vision

DocumentFlow Suite is a **local-first, zero-server document triage system** designed to eliminate "NIGO" (Not In Good Order) documents. It transforms messy, unstandardized client uploads (sideways HEICs, low-res JPEGs, TIFFs) into professional, 150-DPI, upright PDFs—all within the user's browser memory.

## II. The "Inside-Out" Roadmap

We utilize a two-phase rollout to ensure immediate ROI and "Completion-Proof" development.

### Phase 1: The Internal Utility (The "Employee Optimizer")

- **Focus:** Speed and power for internal staff.
- **Goal:** Allow employees to "fix" bad files they've already received.
- **Value:** Cuts Adobe licensing costs and reduces manual cleanup time.
- **Success Criteria:** Normalization (HEIC to PDF), Stapling (Merge 5+ types), and Optimization (< 5MB).

### Phase 2: The External Gateway (The "Client Intake")

- **Focus:** "Grandma-proof" simplicity for public users.
- **Goal:** Prevent bad files from ever reaching the company.
- **Value:** Automates triage at the point of entry; improves Customer Experience (CX).

## III. Master Table of Contents

### Part 1: The External Manual (The Product Suite)

- **The Intelligent Gateway:** Self-service document prep; Real-time rotation/format fixes.
- **The Business Case:** "Adobe vs. DocumentFlow" cost breakdown; ROI Calculator.
- **Privacy & Compliance:** Zero-Server Processing (Data stays in RAM); HIPAA/SOC2 friendly.
- **Mobile & Field Expansion (Phase 2):** Remote submission UI for field agents.

### Part 2: The Internal Manual (The Architect's Vault)

- **Project Governance:** Legal shielding (LLC); Feature Freeze (v1.0 Definition of Done).
- **Engineering Blueprints:**
  - The Agnostic Pipeline: HEIC/TIFF/PDF processing specs.
  - Monorepo Structure: pnpm workspace map (apps/, packages/).
  - Memory Guardrails: Managing browser RAM during heavy processing.
- **DevOps:** Deployment pipelines for Astro (Manual) and Vite (Utility).
- **Business Strategy:** "Company B" target list; Pricing tiers (Trial vs. Enterprise).

## IV. Technical Core: The Agnostic Pipeline

- **Input:** Client uploads blurry/sideways HEIC/JPEG via mobile/desktop.
- **Normalization:** The tool instantly converts the file to a standard Canvas object.
- **Optimization:** 150-DPI downsampling for web-ready viewing.
- **Output:** A perfect, upright PDF.

## V. Success Criteria for Version 1.0

- **Normalization:** Any supported image type becomes an upright, clean PDF page.
- **Stapling:** Multi-file merge into a single document.
- **Optimization:** Final output is optimized for storage without losing text clarity.
