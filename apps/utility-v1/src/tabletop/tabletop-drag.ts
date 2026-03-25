/**
 * Drag-and-drop controller for thumbnail reordering on the tabletop.
 */

export type PageLike = { id: string };

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

/**
 * Workstation-style slot from pointer vs cell rects (grid-safe): insert placeholder before this node.
 * Add-card stays last; dropping is always "before add-card" at end of thumbnails.
 */
export function resolveInsertBeforeTarget(
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

export class ThumbnailDragController {
  private dragPlaceholder: HTMLElement | null = null;
  private lastDropIndex = -1;

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
        this.lastDropIndex = -1;
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
    const ph = flexContainer.querySelector('#drop-placeholder') as HTMLElement | null;
    if (!ph) return;

    const resolved = resolveInsertBeforeTarget(flexContainer, ph, e.clientX, e.clientY);
    if (!resolved) return;
    const { targetEl, pushedEl } = resolved;
    if (targetEl === ph || !flexContainer.contains(targetEl)) return;
    if (ph.nextSibling === targetEl) return;

    const slotIndex = Array.from(flexContainer.children).indexOf(targetEl);
    if (slotIndex === -1) return;
    if (slotIndex === this.lastDropIndex) return;
    this.lastDropIndex = slotIndex;

    const children = Array.from(flexContainer.children).filter(
      (el) => el.getAttribute('data-dragging') !== 'true'
    ) as HTMLElement[];
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
            ? 'transform 0.32s cubic-bezier(0.2, 0, 0, 1)'
            : 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
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
    this.lastDropIndex = -1;
    this.dragPlaceholder?.remove();
    this.dragPlaceholder = null;
    if (!fromId || toIndex === -1) return;
    const fromIndex = pages.findIndex((p) => p.id === fromId);
    if (fromIndex === -1) return;
    onReorder(fromIndex, toIndex);
  }
}
