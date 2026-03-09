# Strategy and Roadmap

Context document for DocumentFlow Suite: strategic vision, phased rollout, completion-proof planning, and client-facing focus. Merged from Project Master Note, Inside-Out Product Rollout, Client-Facing Product Strategy Refinement, and Planning a Completion-Proof Project.

---

## 1. Project objective

Build a **privacy-first, agnostic document triage utility** to eliminate Adobe license overhead and manual file cleanup. The tool normalizes messy client uploads (rotation, merging, conversion) and delivers professional, 150-DPI PDFs—primarily in the user's browser.

---

## 2. The strategic roadmap ("Inside-Out" model)

To ensure project completion and business viability, we follow a **phased rollout**. Starting with an internal employee tool is the safest way to battle-test logic before exposing it to the general public. Employees provide a controlled environment where small bugs are more forgivable and the Agnostic Engine can be refined on real messy files.

### Phase 1: Internal utility (employee tool)

- **Focus:** Speed and power.
- **Deployment:** Standalone internal site or browser extension.
- **Goal:** Allow employees to fix "In Good Order" (IGO) issues (rotation, merging, conversion) instantly on files they've already received.
- **Value:** Cuts Adobe licensing costs and reduces manual cleanup time.

### Phase 2: The intelligent gateway (client-facing)

- **Focus:** Simplicity and "Grandma-proof" UI.
- **Deployment:** Integrated into public-facing upload portals to "stop the mess at the door."
- **Goal:** Prevent bad files from ever reaching employees. Clients get a Smart Gateway that optimizes files before submission.
- **Value:** Improves Customer Experience (CX) and automates triage at the point of entry.

### Phase 3: Field expansion

- **Focus:** Specialized mobile UI for field agents and remote workers.
- **Goal:** Remote submission, touch-friendly UI, and (future) offline-ready behavior.

---

## 3. Client-facing strategy (the intelligent upload portal)

By moving the "user" from the employee to the client (the participant), the tool moves to the "front of the house." Instead of an employee fixing a mess that already arrived, we provide a **Smart Gateway** that prevents the mess from being created. This is easier to sell because it directly improves CX.

- **Current reality:** Client uploads a blurry, sideways HEIC; it sits in a queue for days before an employee realizes they can't open it.
- **Solution:** Client goes to the company site; the component opens. As they upload, the tool checks and optimizes the file. The company receives a perfect, 150-DPI, upright PDF; the employee does zero work.

The "Finish Line" becomes: *A client can upload a document without an employee getting involved.*

---

## 4. Completion-proof planning

Two main killers of side projects: **Scope Creep** (trying to do too much) and **The Wall** (unexpected technical or bureaucratic hurdles). The manual and plan include internal guardrails and external requirements so we stay on track.

### Definition of done (the kill switch)

- **Feature freeze:** List the features that MUST work for v1.0 (e.g., HEIC conversion, rotation, merging). Everything else (e.g., "AI Auto-Fill") moves to Version 2.0. No .docx or .xlsx in v1 to keep the engine serverless and lightweight.
- **"Ship it" checklist:** A short list of tests the app must pass to be considered v1.0.
- **The finish line for Phase 1:** An employee can normalize and staple 5+ different image types into a single optimized PDF.

### Success criteria for version 1.0

- **Normalization:** An employee (or client) can drop a sideways HEIC or messy TIFF and get an upright, clean PDF.
- **Stapling:** Merge 5 different image types into one PDF.
- **Optimization:** Final PDF is &lt; 5MB without losing text clarity.

### Why internal-first protects the finish line

Building the "public version" first demands perfect CSS, complex error handling, and high-level security audits. By starting with the Employee Tool, we build an "ugly but powerful" version that works. Once the company sees the value, they can fund or support time to polish it for clients.

---

## 5. Transition planning and manual sections

- **Feedback loop:** How to collect failure cases from employees in Phase 1 to improve the engine for Phase 2.
- **Permission gates:** How to toggle "Advanced Features" (for employees) vs "Simplified Features" (for clients). Example: employees get a "Manual DPI override" button; clients get an "Auto-Optimize" bar.
- **Internal selling point:** "This tool pays for itself in Phase 1 by cutting Adobe costs. Phase 2 is pure profit via automation."

---

## 6. Milestone-based rewards (time-boxing)

| Milestone | Deliverable | Reward |
|-----------|-------------|--------|
| 1 | Manual 100% written and UI wireframes done | e.g. new keyboard/monitor |
| 2 | PoC: A file goes in, a PDF comes out | e.g. fancy dinner |
| 3 | Beta: One coworker uses it successfully | e.g. social media announcement |

---

## 7. Business necessities and operational planning

- **Legal shielding:** Entity formation (LLC), "Moonlighting" / IP assignment checks (see [LEGAL_AND_IP.md](LEGAL_AND_IP.md)).
- **Feedback loop:** Internal beta group (2–3 non-techy coworkers); user feedback mechanism (e.g. "Submit Bug" to Supabase).
- **Error states:** Define behavior for invalid inputs (e.g. 500MB video instead of a photo).
- **Support plan:** How to handle bugs when selling to another company (e.g. automated error logging like Sentry).

---

## 8. UI wireframes (pre-code)

Before coding, define the app with low-fidelity sketches:

- **Landing state:** Big "Drop Files Here" area.
- **Triage state:** Thumbnails with "X" and "Rotate" buttons.
- **Export state:** "Processing" bar and "Download PDF" button.

---

## 9. Mobile and field expansion (Phase 2 planning)

Even if not built first, plan for it in the code to avoid rewrites later:

- **Mobile UX constraints:** Touch-targets (buttons big enough for thumbs), low-bandwidth uploads.
- **Camera integration API:** Research "Take Photo" vs "Upload File" in mobile Safari/Chrome.

---

*Source docx: Project Master Note (DocumentFlow UI), Inside-Out Product Rollout Strategy, Client-Facing Product Strategy Refinement, Planning a Completion-Proof Project.*
