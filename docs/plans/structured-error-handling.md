# Structured Error Handling

**Branch:** `feature/structured-error-handling`  
**Related:** #5 (analysis-todo-plan), issue #9

---

## Goal

Replace "log and forget" with typed errors and user-facing messages so failures are debuggable and users see why something failed.

## Approach

1. **Typed errors** (`packages/pdf-engine/src/errors.ts`): `DocumentFlowError` with `code` and user-facing `message`. No PII in messages.
2. **Engine layer**: `normalizeToPages` and `generateStapledPDF` throw/rewrap as `DocumentFlowError`.
3. **Service layer**: `ProcessingService` catches worker/engine errors and wraps non-`DocumentFlowError` as `normalizationFailed`.
4. **UI layer**: Show error banner with dismiss; clear on success, new batch, or dismiss.

## Changes

| Layer | File | Changes |
|-------|------|---------|
| Engine | `packages/pdf-engine/src/index.ts` | `unsupportedFileType`, `normalizationFailed`, `exportFailed`; try/catch in `normalizeToPages` and `generateStapledPDF` |
| Engine | `packages/pdf-engine/src/errors.ts` | Existing (unchanged) |
| Service | `apps/utility-v1/src/services/processing-service.ts` | Catch errors in `processFiles`, wrap with `normalizationFailed` when not `DocumentFlowError` |
| UI | `apps/utility-v1/src/components/document-flow-app.ts` | `@state() errorMessage`; `getErrorMessage(err)`; catch in `processAndAddFiles` and `handleExport`; error banner; clear on success/new batch/dismiss |

## Verification

1. **Build:** `pnpm build`
2. **Run:** `pnpm --filter utility-v1 dev`
3. **Process error:** Drop corrupted or unsupported file → error banner appears.
4. **Export error:** Trigger failure (e.g., empty pages edge case if reachable) → error banner appears.
5. **Dismiss:** Click Dismiss → banner clears.
6. **New batch:** Start new batch → clears any existing error.
