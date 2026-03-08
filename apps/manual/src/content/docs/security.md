---
title: Zero-Server Privacy Model
description: How DocumentFlow Suite keeps your data in RAM—no server uploads, inherently HIPAA friendly.
---

## Data Stays in RAM

DocumentFlow Suite is designed around a **zero-server** architecture. All document processing—HEIC conversion, rotation, resizing, PDF generation—happens entirely in the user's browser.

### What This Means

- **No uploads** — Files never leave the device
- **No server-side storage** — There is no backend database or blob store for documents
- **No persistent logging** — Document content is not logged or transmitted
- **In-memory only** — Data exists in JavaScript memory during processing and is garbage-collected when done

## HIPAA Considerations

Because no Protected Health Information (PHI) is transmitted or stored on a server, DocumentFlow Suite can be used in healthcare and other regulated environments without adding server-side HIPAA compliance burden.

**Important:** Consult your compliance team. Client-side processing reduces scope but does not eliminate all obligations (e.g., BAA requirements if you use third-party services elsewhere in the same workflow).

## Threat Model

- **Assumption:** The user's browser and device are trusted
- **Assumption:** No man-in-the-middle or malicious CDN serving the app (use integrity checks or self-host)
- **Out of scope:** Protection against malicious browser extensions or compromised client environments
