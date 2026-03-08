---
title: Project Governance
description: Legal shielding, employment review, and v1.0 feature freeze. Architect's Vault.
sidebar:
  badge:
    text: Internal
    variant: caution
---

## Legal Shielding

- **LLC Formation Status:** *To be documented.*
- **IP Ownership:** DocumentFlow Suite is developed using a clean-room approach. All code is written from scratch without copying proprietary implementations. Third-party dependencies (pdf-lib, heic2any) are used under their respective licenses.

## Employment Review

- **Moonlighting Checks:** *Status of contract clauses and employment review to be documented.*
- Ensure all contributors acknowledge IP ownership and clean-room development practices.

## Feature Freeze: Definition of Done for v1.0

The following are **strictly in scope** for v1.0:

- **Normalization:** Any supported image type (HEIC, TIFF, JPEG, PNG, etc.) becomes an upright, clean PDF page.
- **Stapling:** Multi-file merge into a single document (5+ types).
- **Optimization:** Final output &lt; 5MB; optimized for storage without losing text clarity.

**Strictly out of scope** for v1.0:

- No .docx or .xlsx support
- No server-side document processing
- No cloud storage for documents
