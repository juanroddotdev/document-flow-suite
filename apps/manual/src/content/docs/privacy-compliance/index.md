---
title: Privacy & Compliance
description: Zero-server processing, HIPAA/SOC2 friendly architecture, and data security FAQ.
---

## Zero-Server Processing

DocumentFlow Suite is designed around a **zero-server** architecture for document processing. All conversion, rotation, resizing, and PDF generation happens entirely in the user's browser.

### What This Means

- **No uploads** — Files never leave the device
- **No server-side storage** — No backend database or blob store for documents
- **No persistent logging** — Document content is not logged or transmitted
- **In-memory only** — Data exists in JavaScript memory during processing and is garbage-collected when done

## Compliance Standards: HIPAA and SOC2 Friendly

Because no Protected Health Information (PHI) or sensitive document content is transmitted or stored on a server, DocumentFlow can be used in healthcare and other regulated environments without adding server-side compliance burden.

**Important:** Consult your compliance team. Client-side processing reduces scope but does not eliminate all obligations (e.g., BAA requirements if you use third-party services elsewhere in the same workflow).

## Data Security FAQ

**Q: Where are my documents stored?**  
A: Nowhere. They exist only in your browser's memory during processing and are discarded when you close the tab or clear the session.

**Q: Are documents uploaded to your servers?**  
A: No. Document processing is 100% client-side.

**Q: Do you log or analyze document content?**  
A: No. We do not log, transmit, or analyze document content.

**Q: Can we self-host the application?**  
A: Yes. The tool can be self-hosted to meet internal security policies.
