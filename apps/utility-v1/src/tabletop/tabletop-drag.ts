/**
 * Drag-and-drop controller for thumbnail reordering on the tabletop.
 */

export type PageLike = { id: string };

/** Pixels each side of cell midline: keep previous insert-before target while pointer stays in band. */
const NEUTRAL_BAND_PX = 12;

const FLIP_DURATION_DEFAULT = '0.5s';
const FLIP_DURATION_PUSHED = '0.55s';
const FLIP_EASE_DEFAULT = 'cubic-bezier(0.33, 1, 0.68, 1)';
const FLIP_EASE_PUSHED = 'cubic-bezier(0.33, 1, 0.68, 1)';

/** Thumbnail slots (not placeholder, not dragging) + optional add-card sentinel, in DOM order. */
function getThumbnailSlots(flex: HTMLElement, ph: HTMLElement): HTMLElement[] {
  return Array.from(flex.children).filter(
    (el): el is HTMLElement =>
      el !== ph &&
      el instanceof HTMLElement &&
      el.classList.contains('thumbnail-item') &&
      el.hasAttribute('data-page-id') &&
      el.getAttribute('data-dragging') !== 'true'
  );
}

export function getSlotKey(el: HTMLElement): string {
  if (el.hasAttribute('data-add-card')) return '__add__';
  return el.getAttribute('data-page-id') ?? '';
}

function computeRawInsertBeforeTarget(
  flex: HTMLElement,
  ph: HTMLElement,
  clientX: number,
  clientY: number
): { targetEl: HTMLElement; pushedEl: HTMLElement | null } | null {
  const addCard = flex.querySelector('[data-add-card]') as HTMLElement | null;
  const slots = getThumbnailSlots(flex, ph);
  if (slots.length === 0) {
    return addCard ? { targetEl: addCard, pushedEl: null } : null;
  }

  const cx = clientX;
  const cy = clientY;

  let containing: HTMLElement | null = null;
  for (const el of slots) {
    const r = el.getBoundingClientRect();
    if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
      containing = el;
      break;
    }
  }

  let pushedEl: HTMLElement | null = null;
  let targetEl: HTMLElement;

  if (containing) {
    pushedEl = containing;
    const r = containing.getBoundingClientRect();
    const midX = r.left + r.width / 2;
    const idx = slots.indexOf(containing);
    if (cx < midX) {
      targetEl = containing;
    } else {
      targetEl = slots[idx + 1] ?? addCard ?? containing;
    }
  } else {
    let best = slots[0];
    let bestD = Infinity;
    for (const el of slots) {
      const r = el.getBoundingClientRect();
      const mx = r.left + r.width / 2;
      const my = r.top + r.height / 2;
      const d = Math.abs(cx - mx) + Math.abs(cy - my);
      if (d < bestD) {
        bestD = d;
        best = el;
      }
    }
    pushedEl = best;
    const r = best.getBoundingClientRect();
    const midX = r.left + r.width / 2;
    const idx = slots.indexOf(best);
    if (cx < midX) {
      targetEl = best;
    } else {
      targetEl = slots[idx + 1] ?? addCard ?? best;
    }
  }

  if (!targetEl) return null;
  return { targetEl, pushedEl };
}

/**
 * Workstation-style slot from pointer vs cell rects (grid-safe): insert placeholder before this node.
 * Add-card stays last; dropping is always "before add-card" at end of thumbnails.
 * Optional `lastStableTarget` + neutral band around cell midline reduces mid-edge oscillation.
 */
export function resolveInsertBeforeTarget(
  flex: HTMLElement,
  ph: HTMLElement,
  clientX: number,
  clientY: number,
  lastStableTarget?: HTMLElement | null
): { targetEl: HTMLElement; pushedEl: HTMLElement | null } | null {
  const raw = computeRawInsertBeforeTarget(flex, ph, clientX, clientY);
  if (!raw) return null;
  if (lastStableTarget == null || !flex.contains(lastStableTarget)) return raw;
  if (raw.targetEl === lastStableTarget) return raw;
  const pivot = raw.pushedEl;
  if (!pivot) return raw;
  const r = pivot.getBoundingClientRect();
  const midX = r.left + r.width / 2;
  if (Math.abs(clientX - midX) <= NEUTRAL_BAND_PX) {
    return { targetEl: lastStableTarget, pushedEl: raw.pushedEl };
  }
  return raw;
}

export class ThumbnailDragController {
  private dragPlaceholder: HTMLElement | null = null;
  /** Dedupe FLIP when insert slot + hovered card are unchanged (stable keys). */
  private lastDropFrameKey = '';
  /** Last committed insert-before target; feeds hysteresis in resolveInsertBeforeTarget. */
  private lastStableTargetEl: HTMLElement | null = null;
  private pendingDrag: { flex: HTMLElement; x: number; y: number } | null = null;
  private dragOverRaf: number | null = null;

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
  }
}
