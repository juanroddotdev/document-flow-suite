/**
 * Tabletop DOM builders and event attachment for the document flow app.
 */

import { escapeHtml } from '../utils/html.js';
import type { PageState } from '../app-state.js';

export interface TabletopEventHandlers {
  dismissError: () => void;
  addFiles: () => void;
  startNewBatch: () => void;
  onRotate: (e: Event) => void;
  onDelete: (e: Event) => void;
  onDragStart: (e: DragEvent, flexContainer: HTMLElement) => void;
  onDragOver: (e: DragEvent, flexContainer: HTMLElement) => void;
  onDrop: (e: DragEvent, flexContainer: HTMLElement) => void;
}

function buildErrorBanner(errorMessage: string): string {
  return `<div class="flex items-center justify-between gap-4 px-4 py-2 bg-red-50 border-b border-red-200 text-red-800 text-sm" role="alert">
    <span>${escapeHtml(errorMessage)}</span>
    <button type="button" data-dismiss-error class="text-red-600 hover:text-red-800 font-medium" aria-label="Dismiss">Dismiss</button>
  </div>`;
}

export function buildEmptyDropzoneHtml(errorBanner?: string): string {
  const banner = errorBanner ?? '';
  return (
    banner +
    `
    <div class="text-center text-slate-500 empty-dropzone-content">
      <p class="text-xl font-semibold text-slate-600">Drop Files Anywhere</p>
      <p class="text-sm mt-2">or click to browse</p>
      <p class="text-xs mt-3 text-slate-400">HEIC, TIFF, PNG, JPG, PDF</p>
    </div>
  `
  );
}

export function buildSuccessHtml(errorBanner?: string): string {
  const banner = errorBanner ?? '';
  return (
    banner +
    `
    <div class="flex flex-col items-center justify-center gap-4 text-center p-8">
      <p class="text-xl font-semibold text-slate-700">Download Started!</p>
      <button type="button" id="start-new-batch" class="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
        Start New Batch
      </button>
    </div>
  `
  );
}

export type CardStyle = 'glass' | 'capsule' | 'action-first';
export type DragHandleStyle = 'whole-card' | 'side-handle' | 'bent-corner';

export function buildThumbnailsHtml(
  pages: PageState[],
  errorBanner?: string,
  cardStyle: CardStyle = 'glass',
  dragHandleStyle: DragHandleStyle = 'whole-card'
): string {
  const banner = errorBanner ?? '';
  const isWholeCard = dragHandleStyle === 'whole-card';
  const thumbnailsHtml = pages
    .map(
      (p, i) => {
        const draggable = isWholeCard ? 'true' : 'false';
        const cursorClass = isWholeCard ? ' cursor-grab' : '';
        return `
    <div class="thumbnail-item${cursorClass}" data-page-id="${p.id}" data-index="${i}" draggable="${draggable}">
      <file-thumbnail data-page-id="${p.id}" status="${p.status}" card-style="${cardStyle}"></file-thumbnail>
    </div>
  `;
      }
    )
    .join('');

  const addCardHtml = `
    <div data-add-card class="add-card flex flex-col items-center justify-center w-full min-w-[160px] min-h-[160px] border-2 border-dashed border-slate-400 rounded-xl bg-slate-50 hover:border-slate-500 hover:bg-slate-100 cursor-pointer transition-all duration-200" role="button" tabindex="0" aria-label="Add more files">
      <span class="text-3xl text-slate-500">+</span>
      <span class="text-sm text-slate-600 mt-1">Add files</span>
    </div>
  `;

  return (
    banner +
    `
    <div id="thumbnails-flex" class="grid gap-4 p-4 overflow-auto w-full" style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); justify-items: center; align-content: start;">
      ${thumbnailsHtml}
      ${addCardHtml}
    </div>
  `
  );
}

export function attachTabletopEvents(
  container: HTMLElement,
  pages: PageState[],
  handlers: TabletopEventHandlers,
  dragHandleStyle: DragHandleStyle = 'whole-card'
): void {
  container.querySelector('[data-dismiss-error]')?.addEventListener('click', handlers.dismissError);

  const addCard = container.querySelector('[data-add-card]');
  addCard?.addEventListener('click', handlers.addFiles);
  addCard?.addEventListener('keydown', (e: Event) => {
    const ev = e as KeyboardEvent;
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      handlers.addFiles();
    }
  });

  container.querySelector('#start-new-batch')?.addEventListener('click', handlers.startNewBatch);

  const flexContainer = container.querySelector('#thumbnails-flex') as HTMLElement;
  if (!flexContainer) return;

  container.querySelectorAll('file-thumbnail').forEach((el, i) => {
    const p = pages[i];
    if (p) {
      el.setAttribute('preview', p.previewDataUrl ?? '');
      el.setAttribute('filename', p.filename);
      el.setAttribute('page-index', String(i + 1));
    }
  });

  const draggables =
    dragHandleStyle === 'whole-card'
      ? container.querySelectorAll('.thumbnail-item[draggable="true"]')
      : container.querySelectorAll('[data-drag-handle][draggable="true"]');
  draggables.forEach((el) => {
    el.addEventListener('dragstart', (e: Event) =>
      handlers.onDragStart(e as DragEvent, flexContainer)
    );
    el.addEventListener('dragover', (e: Event) =>
      handlers.onDragOver(e as DragEvent, flexContainer)
    );
    el.addEventListener('drop', (e: Event) =>
      handlers.onDrop(e as DragEvent, flexContainer)
    );
  });

  container.querySelectorAll('file-thumbnail').forEach((el) => {
    el.addEventListener('rotate', handlers.onRotate);
    el.addEventListener('delete', handlers.onDelete);
  });
}

export function getErrorBanner(errorMessage: string): string {
  return buildErrorBanner(errorMessage);
}

export interface ProcessProgress {
  current: number;
  total: number;
}

export interface TabletopSetupHandlers {
  onFileDrop: (files: FileList) => void | Promise<void>;
  onEmptyClick: () => void;
}

/**
 * Wire tabletop-level events: file drop zone (dragover/dragleave/drop) and empty-state click.
 */
export function setupTabletopListeners(
  tabletop: HTMLElement,
  getHasPages: () => boolean,
  handlers: TabletopSetupHandlers
): void {
  tabletop.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!(e as DragEvent).dataTransfer?.types.includes('text/plain')) {
      tabletop.classList.add('border-slate-500', 'bg-slate-50');
    }
  });
  tabletop.addEventListener('dragleave', (e) => {
    if (!tabletop.contains((e as DragEvent).relatedTarget as Node)) {
      tabletop.classList.remove('border-slate-500', 'bg-slate-50');
    }
  });
  tabletop.addEventListener('drop', async (e: Event) => {
    const ev = e as DragEvent;
    tabletop.classList.remove('border-slate-500', 'bg-slate-50');
    const files = ev.dataTransfer?.files;
    if (!files?.length) return;
    ev.preventDefault();
    await handlers.onFileDrop(files);
  });
  tabletop.addEventListener('click', (e) => {
    if (getHasPages()) return;
    if (!tabletop.contains(e.target as Node)) return;
    handlers.onEmptyClick();
  });
}

export function createProgressBar(container: HTMLElement): {
  remove: () => void;
  update: (p: ProcessProgress) => void;
} {
  const progressWrap = document.createElement('div');
  progressWrap.className = 'w-full px-4 py-2 bg-slate-100 border-b border-slate-200';
  progressWrap.innerHTML = `
    <p class="text-sm font-medium text-slate-600 progress-text">Processing…</p>
    <div class="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
      <div class="progress-fill h-full bg-slate-600 rounded-full transition-all duration-200" style="width: 0%"></div>
    </div>
  `;
  const progressText = progressWrap.querySelector('.progress-text') as HTMLElement;
  const progressFill = progressWrap.querySelector('.progress-fill') as HTMLElement;
  container.prepend(progressWrap);

  return {
    remove: () => progressWrap.remove(),
    update: (p) => {
      if (progressText) progressText.textContent = `Processing file ${p.current} of ${p.total}`;
      if (progressFill) progressFill.style.width = `${(p.current / p.total) * 100}%`;
    },
  };
}
