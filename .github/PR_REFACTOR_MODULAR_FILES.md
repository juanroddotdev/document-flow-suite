# refactor(utility-v1): Modular files — extract utils, tabletop, and drag-and-drop

## What

Refactors the utility-v1 app by breaking up long files into focused, modular modules. No behavior changes—structural improvements only.

### Changes

- **Phase 1: Extract utilities** — `utils/` (error, html, filename, blob)
- **Phase 2: Extract drag-and-drop** — `tabletop/tabletop-drag.ts` with `ThumbnailDragController`
- **Phase 3: Extract tabletop rendering** — `tabletop/tabletop-render.ts` (builders, event attachment)
- **Phase 4: Slim document-flow-app** — progress bar, `setupTabletopListeners`; handler consolidation

### Result

- `document-flow-app.ts`: 464 → 294 lines
- New modules: `utils/` (4 files), `tabletop/` (2 files)
- app-state.ts: types and constants only

## Checklist

- [ ] Fixes #__ _(see [backlog](docs/plans/backlog.md) for plan → issue mapping)_
- [x] `pnpm build` succeeds
- [x] All flows verified: drop, process, reorder, rotate, delete, export, error, new batch
