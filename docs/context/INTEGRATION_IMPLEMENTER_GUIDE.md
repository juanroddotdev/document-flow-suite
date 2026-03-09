---
title: Integration & Implementer's Guide
description: Deployment options, three-step drop-in, and checklist.
---

# Integration and Implementer's Guide

Context document for DocumentFlow Suite: deployment options and technical integration for IT and implementers. Merged from DocumentFlow Integration – The Implementer's Guide.

---

## 1. Purpose

This page reassures **implementers**—IT managers and lead developers putting the tool into production. It shows that DocumentFlow is a **drop-in** solution, not a heavy lift. Built with standardized Web Components (Lit), it integrates into existing portals without a full rewrite.

---

## 2. Deployment options

| Configuration | Description | Best for | Setup time |
|---------------|-------------|----------|------------|
| **A. Standalone Utility (Phase 1)** | Dedicated internal URL (e.g. triage.yourcompany.com) where employees process documents they already have. | Immediate Adobe license reduction and back-office cleanup. | &lt; 1 day |
| **B. Embedded Gateway (Phase 2)** | Component dropped into the client-facing upload page; acts as a smart filter between user's computer and storage. | Preventing NIGO at the point of entry. | 1–2 weeks (including API testing) |
| **C. Browser Overlay (Managed Extension)** | Corporate Chrome/Edge extension that injects the triage tool into the browser window of a legacy CRM. | Teams on 3rd-party platforms they don't own. | ~1 week |

---

## 3. Technical integration: the "three-step" drop

Integration follows the native Web Component standard:

1. **Include the script:** Load the lightweight library in the global header.
2. **Add the tag:** Place `<document-flow-triage>` where the tool should appear.
3. **Listen for the event:** Capture the finalized PDF Blob to send to your server.

Example:

```html
<script type="module" src="https://cdn.yourcompany.com/document-flow.js"></script>
<document-flow-triage
  theme="corporate"
  max-files="10"
  on-complete="handleUpload">
</document-flow-triage>
```

---

## 4. Implementation checklist

- [ ] **Environment audit:** Identify primary browser used by staff (Chrome, Edge, Safari).
- [ ] **Brand customization:** Supply brand hex codes and logos to the internal /ui-library package.
- [ ] **Security approval:** Review the Zero-Server architecture with CISO or Security Lead.
- [ ] **User Acceptance Testing (UAT):** 5-day trial with a small group of power users to verify workflow speed.

---

## 5. Maintenance and updates

The core engine is **decoupled from the UI**. Updates to Agnostic Input logic (e.g. a new mobile photo format) can be pushed to the central library without changes to the host website.

**Note for IT:** DocumentFlow has **zero server-side dependencies** (no Node.js, Python, or Java on the host server). It is a pure client-side asset.

---

*Source docx: DocumentFlow Integration – The Implementer's Guide.*
