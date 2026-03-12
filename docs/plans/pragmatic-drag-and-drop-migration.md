# Migration to Pragmatic Drag and Drop

We will replace the buggy custom HTML5 drag-and-drop implementation in `document-flow-app.ts` with Atlassian's lightweight `@atlaskit/pragmatic-drag-and-drop` library.

## Proposed Changes

### Dependencies
#### [MODIFY] `apps/utility-v1/package.json`
Add the following dependencies to the `utility-v1` application:
- `@atlaskit/pragmatic-drag-and-drop`
- `@atlaskit/pragmatic-drag-and-drop-hitbox` (for detecting drop positions like "before" or "after" an element)

### Core App Component
#### [MODIFY] `apps/utility-v1/src/components/document-flow-app.ts`

**1. Remove Custom DnD State and Listeners:**
- Remove properties like `dragPlaceholder`, `lastDropIndex`.
- Remove manual HTML5 event listeners (`dragstart`, `dragover`, `drop`, `dragend`) attached to the document, the virtual container, and the items.
- Remove methods that directly mutate the DOM for placeholders: `ensurePlaceholder`, `handleDragStart`, `handleContainerDragOver`, `handleContainerDrop`, `handleDragOver`, `handleDrop`.

**2. Introduce Pragmatic DnD:**
- Use the `draggable` utility on each virtual thumbnail item when rendering them.
- Use the `dropTargetForElements` utility on each virtual thumbnail item to make them accept drops.
- Use the `monitorForElements` utility globally when the tabletop renders to listen for a drop event to complete. 

**3. State-Driven Reordering:**
- When a `drop` event fires from the monitor, we will extract the `source` (dragged item ID) and the `location` (target item ID and whether the drop was on the left/right/top/bottom half of the target).
- We'll then calculate the new position in the `this.pages` array, move the item, and trigger a re-render. Since Pragmatic DnD doesn't forcibly alter the DOM, Lit will naturally re-render the list seamlessly based on the updated `this.pages` state.
- Add Lit `@state` variables (e.g., `dragSourceId`, `dragTargetId`, `dropEdge`) to visually render a subtle outline or line placeholder purely through CSS classes instead of manually creating and inserting a `<div>` into the DOM.

## Verification Plan
### Automated Tests
- Run `pnpm dev` and ensure the application boots up.

### Manual Verification
- Upload multiple images/PDFs to populate the list.
- Click and drag a thumbnail mid-list.
- Hover over other items and verify drop indicators show smoothly.
- Drop the item and confirm the items shift instantly without crashing the virtual scroll container.
