/**
 * Drag-and-drop controller for thumbnail reordering on the tabletop.
 */

export type PageLike = { id: string };

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
      'flex-shrink-0 border-2 border-dashed border-slate-400 rounded-lg bg-slate-100/80 rounded-lg';
    this.dragPlaceholder.style.width = `${widthPx}px`;
    this.dragPlaceholder.style.height = `${heightPx}px`;
    this.dragPlaceholder.style.minWidth = `${widthPx}px`;
    this.dragPlaceholder.setAttribute('aria-hidden', 'true');
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

    document.addEventListener(
      'dragend',
      () => {
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
    const over = (e.target as HTMLElement).closest('[data-page-id]') as HTMLElement | null;
    const overPlaceholder = (e.target as HTMLElement).closest('#drop-placeholder');
    if (overPlaceholder) return;
    if (!over) return;
    const targetIdx = Array.from(flexContainer.children).indexOf(over);
    const currentIdx = Array.from(flexContainer.children).indexOf(ph);
    let newPhIndex: number;
    if (targetIdx < currentIdx) {
      newPhIndex = targetIdx;
    } else if (targetIdx > currentIdx) {
      newPhIndex = targetIdx;
    } else {
      return;
    }
    if (newPhIndex === currentIdx) return;
    if (newPhIndex === this.lastDropIndex) return;
    this.lastDropIndex = newPhIndex;

    const targetEl = flexContainer.children[newPhIndex];
    if (targetEl && targetEl !== ph) {
      flexContainer.insertBefore(ph, targetEl);
    }
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
