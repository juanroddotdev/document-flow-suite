# DocumentFlow Suite — Internal Documentation

## Definition of Done for v1.0

- **HEIC/TIFF normalization** — Successfully convert and normalize HEIC and TIFF files to a consistent canvas format
- **Visual reordering** — Users can visually reorder pages before export
- **150-DPI PDF export** — Export produces a single optimized PDF at 150 DPI

## Feature Freeze (v1.0)

The following are **strictly out of scope** for v1.0:

- **No server-side processing** — All processing must occur client-side in the browser
- **No .docx support** — Word documents are not supported in v1.0
- **No cloud storage** — No integration with S3, GCS, or similar; no upload/download to external storage

## Zero-Storage & Phase 1 Scope

Phase 1 is strictly **client-side for images**. No server-side processing for image normalization, stapling, or PDF export.

If DOCX support is added later, it will use a **stateless Edge Function** (process in memory, return result, no persistence). The **Zero-Storage rule** remains absolute: no file storage on servers, ever.

## Legal Shield

### IP Ownership

- DocumentFlow Suite is developed using a **clean-room approach**
- All code is written from scratch without copying proprietary implementations
- Third-party dependencies (e.g., `pdf-lib`, `heic2any`) are used under their respective licenses
- Ensure all contributors acknowledge IP ownership and clean-room development practices
