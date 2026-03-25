/**
 * Drag-and-drop controller for thumbnail reordering on the tabletop.
 */

import {
  clampPointToRect,
  computeRawInsertBeforeTarget,
  getSlotKey,
  resolveInsertBeforeTarget,
} from './tabletop-slot-resolve.js';

export type PageLike = { id: string };

const FLIP_DURATION_DEFAULT = '0.5s';
const FLIP_DURATION_PUSHED = '0.55s';
const FLIP_EASE_DEFAULT = 'cubic-bezier(0.33, 1, 0.68, 1)';
const FLIP_EASE_PUSHED = 'cubic-bezier(0.33, 1, 0.68, 1)';

export { getSlotKey, resolveInsertBeforeTarget } from './tabletop-slot-resolve.js';

export class ThumbnailDragController {
  private dragPlaceholder: HTMLElement | null = null;
  /** Dedupe FLIP when insert slot + hovered card are unchanged (stable keys). */
  private lastDropFrameKey = '';
  /** Last committed insert-before target; feeds hysteresis in resolveInsertBeforeTarget. */
  private lastStableTargetEl: HTMLElement | null = null;
  private pendingDrag: { flex: HTMLElement; x: number; y: number } | null = null;
  private dragOverRaf: number | null = null;

  /** Last pointer during drag (for snap on dragend when drop did not commit). */
  private lastClientX = 0;
  private lastClientY = 0;
  /** True after handleDrop successfully calls onReorder. */
  private reorderCommitted = false;
  /** data-page-id of the card being dragged; cleared on dragend. */
  private draggingFromId: string | null = null;
  /** Active drag session for snap fallback (cleared on dragend). */
  private dragSession: {
    flex: HTMLElement;
    pages: PageLike[];
    onReorder: (fromIndex: number, toIndex: number) => void;
  } | null = null;

  ensurePlaceholder(container: HTMLElement, widthPx: number, heightPx: number): HTMLElement {
    if (this.dragPlaceholder && this.dragPlaceholder.parentElement === container) {
      this.dragPlaceholder.style.width = `${widthPx}px`;
      this.dragPlaceholder.style.height = `${heightPx}px`;
      return this.dragPlaceholder;
    }
    if (this.dragPlaceholder?.parentElement) this.dragPlaceholder.remove();
    this.dragPlaceholder = document.createElement('div');
    this.dragPlaceholder.id = 'drop-placeholder';
    this.dragPlaceholder.className =
      'flex-shrink-0 border-2 border-dashed border-slate-400 rounded-lg bg-slate-100/80 rounded-lg relative';
    this.dragPlaceholder.style.width = `${widthPx}px`;
    this.dragPlaceholder.style.height = `${heightPx}px`;
    this.dragPlaceholder.style.minWidth = `${widthPx}px`;
    this.dragPlaceholder.setAttribute('aria-hidden', 'true');
    const insertionLine = document.createElement('div');
    insertionLine.className = 'drop-insertion-line';
    insertionLine.setAttribute('aria-hidden', 'true');
    this.dragPlaceholder.appendChild(insertionLine);
    return this.dragPlaceholder;
  }

  /**
   * If the browser never delivered a successful drop, commit reorder from last pointer using raw
   * geometry (no hysteresis). Pointer is clamped to the flex strip so outside releases snap to the
   * nearest slot.
   */
  private commitSnapIfNeeded(): void {
    if (this.reorderCommitted) return;
    const session = this.dragSession;
    const ph = this.dragPlaceholder;
    const fromId = this.draggingFromId;
    if (!session || !ph || !fromId) return;

    const { flex, pages, onReorder } = session;
    if (!flex.contains(ph)) return;

    const rect = flex.getBoundingClientRect();
    const { x, y } = clampPointToRect(rect, this.lastClientX, this.lastClientY);
    const raw = computeRawInsertBeforeTarget(flex, ph, x, y);
    if (!raw) return;
    const { targetEl } = raw;
    if (targetEl === ph || !flex.contains(targetEl)) return;

    if (ph.nextSibling !== targetEl) {
      flex.insertBefore(ph, targetEl);
    }

    const toIndex = Array.from(flex.children).indexOf(ph);
    const fromIndex = pages.findIndex((p) => p.id === fromId);
    if (fromIndex === -1 || toIndex === -1) return;
    if (fromIndex === toIndex) return;

    this.lastDropFrameKey = '';
    this.lastStableTargetEl = null;
    this.dragPlaceholder?.remove();
    this.dragPlaceholder = null;
    this.reorderCommitted = true;
    onReorder(fromIndex, toIndex);
  }

  handleDragStart(
    e: DragEvent,
    flexContainer: HTMLElement,
    pages: PageLike[],
    onDragEnd: () => void,
    onReorder: (fromIndex: number, toIndex: number) => void
  ): void {
    const target = e.currentTarget as HTMLElement;
    const id = target.getAttribute('data-page-id');
    if (id) e.dataTransfer?.setData('text/plain', id);
    e.dataTransfer!.effectAllowed = 'move';

    this.dragSession = { flex: flexContainer, pages, onReorder };
    this.draggingFromId = id ?? null;
    this.reorderCommitted = false;
    this.lastClientX = e.clientX;
    this.lastClientY = e.clientY;

    const rect = target.getBoundingClientRect();
    const ph = this.ensurePlaceholder(flexContainer, rect.width, rect.height);
    flexContainer.insertBefore(ph, target);
    target.setAttribute('data-dragging', 'true');
    target.style.position = 'absolute';
    target.style.left = `${rect.left}px`;
    target.style.top = `${rect.top}px`;
    target.style.opacity = '0';
    target.style.pointerEvents = 'none';

    const boundDragover = (ev: Event) => this.handleDragOver(ev as DragEvent, flexContainer);
    flexContainer.addEventListener('dragover', boundDragover);

    document.addEventListener(
      'dragend',
      () => {
        this.commitSnapIfNeeded();
        flexContainer.removeEventListener('dragover', boundDragover);
        if (this.dragOverRaf != null) {
          cancelAnimationFrame(this.dragOverRaf);
          this.dragOverRaf = null;
        }
        this.pendingDrag = null;
        this.lastDropFrameKey = '';
        this.lastStableTargetEl = null;
        this.dragPlaceholder?.remove();
        this.dragPlaceholder = null;
        this.dragSession = null;
        this.draggingFromId = null;
        this.reorderCommitted = false;
        onDragEnd();
      },
      { once: true, capture: true }
    );

    ph.addEventListener('dragover', (ev: Event) => this.handleDragOver(ev as DragEvent, flexContainer));
    ph.addEventListener('drop', (ev: Event) =>
      this.handleDrop(ev as DragEvent, flexContainer, pages, onReorder)
    );
  }

  handleDragOver(e: DragEvent, flexContainer: HTMLElement): void {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    this.lastClientX = e.clientX;
    this.lastClientY = e.clientY;
    this.pendingDrag = { flex: flexContainer, x: e.clientX, y: e.clientY };
    if (this.dragOverRaf != null) return;
    this.dragOverRaf = requestAnimationFrame(() => {
      this.dragOverRaf = null;
      const p = this.pendingDrag;
      if (!p) return;
      this.applyDragOver(p.flex, p.x, p.y);
    });
  }

  private applyDragOver(flexContainer: HTMLElement, clientX: number, clientY: number): void {
    const ph = flexContainer.querySelector('#drop-placeholder') as HTMLElement | null;
    if (!ph) return;

    const resolved = resolveInsertBeforeTarget(
      flexContainer,
      ph,
      clientX,
      clientY,
      this.lastStableTargetEl
    );
    if (!resolved) return;
    const { targetEl, pushedEl } = resolved;
    if (targetEl === ph || !flexContainer.contains(targetEl)) return;

    const slotKey = getSlotKey(targetEl);
    const pushedKey = pushedEl ? getSlotKey(pushedEl) : '__none__';
    const frameKey = `${slotKey}|${pushedKey}`;

    if (ph.nextSibling === targetEl) {
      if (frameKey === this.lastDropFrameKey) return;
      flexContainer.querySelectorAll('.card-pushed').forEach((el) => el.classList.remove('card-pushed'));
      if (pushedEl) pushedEl.classList.add('card-pushed');
      this.lastDropFrameKey = frameKey;
      return;
    }

    if (frameKey === this.lastDropFrameKey) return;
    this.lastDropFrameKey = frameKey;

    const children = Array.from(flexContainer.children).filter(
      (el) => el.getAttribute('data-dragging') !== 'true'
    ) as HTMLElement[];
    children.forEach((el) => {
      el.getAnimations?.().forEach((a) => a.cancel());
      el.style.transition = '';
      el.style.transitionDelay = '';
      el.style.transform = '';
      el.classList.remove('card-pushed');
    });

    const oldRects = new Map<HTMLElement, DOMRect>();
    children.forEach((el) => oldRects.set(el, el.getBoundingClientRect()));

    const childListBefore = Array.from(flexContainer.children);
    const phIdxBefore = childListBefore.indexOf(ph);
    const idxBefore = new Map<HTMLElement, number>();
    childListBefore.forEach((el, i) => {
      if (el instanceof HTMLElement) idxBefore.set(el, i);
    });

    flexContainer.querySelectorAll('.card-pushed').forEach((el) => el.classList.remove('card-pushed'));

    flexContainer.insertBefore(ph, targetEl);
    this.lastStableTargetEl = targetEl;

    requestAnimationFrame(() => {
      children.forEach((el) => {
        const oldR = oldRects.get(el);
        if (!oldR) return;
        const newR = el.getBoundingClientRect();
        const dx = oldR.left - newR.left;
        const dy = oldR.top - newR.top;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
        const elIdx = idxBefore.get(el) ?? 0;
        const dist = Math.abs(elIdx - phIdxBefore);
        const delayMs = Math.min(dist * 12, 80);
        el.style.transition = 'none';
        el.style.transitionDelay = '';
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        if (pushedEl && el === pushedEl) el.classList.add('card-pushed');
        el.offsetHeight;
        requestAnimationFrame(() => {
          const isPushed = pushedEl && el === pushedEl;
          el.style.transition = isPushed
            ? `transform ${FLIP_DURATION_PUSHED} ${FLIP_EASE_PUSHED}`
            : `transform ${FLIP_DURATION_DEFAULT} ${FLIP_EASE_DEFAULT}`;
          el.style.transitionDelay = `${delayMs}ms`;
          el.style.transform = 'translate(0, 0)';
          const clearTransition = () => {
            el.style.transition = '';
            el.style.transitionDelay = '';
            el.style.transform = '';
            el.classList.remove('card-pushed');
            el.removeEventListener('transitionend', clearTransition);
          };
          el.addEventListener('transitionend', clearTransition);
        });
      });
    });
  }

  handleDrop(
    e: DragEvent,
    flexContainer: HTMLElement,
    pages: PageLike[],
    onReorder: (fromIndex: number, toIndex: number) => void
  ): void {
    e.preventDefault();
    const fromId = e.dataTransfer?.getData('text/plain');
    const currentTarget = e.currentTarget as HTMLElement;
    let toIndex: number;
    if (currentTarget.id === 'drop-placeholder') {
      toIndex = Array.from(flexContainer.children).indexOf(currentTarget);
    } else {
      const toEl = currentTarget.closest('[data-page-id]') as HTMLElement;
      const toId = toEl?.getAttribute('data-page-id');
      if (!toId || fromId === toId) {
        this.dragPlaceholder?.remove();
        this.dragPlaceholder = null;
        return;
      }
      toIndex = pages.findIndex((p) => p.id === toId);
    }
    this.lastDropFrameKey = '';
    this.lastStableTargetEl = null;
    this.dragPlaceholder?.remove();
    this.dragPlaceholder = null;
    if (!fromId || toIndex === -1) return;
    const fromIndex = pages.findIndex((p) => p.id === fromId);
    if (fromIndex === -1) return;
    onReorder(fromIndex, toIndex);
    this.reorderCommitted = true;
  }
}
