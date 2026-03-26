/**
 * Tabletop DOM builders and event attachment for the document flow app.
 */

import { escapeHtml } from '../utils/html.js';
import type { IslandState } from '../app-state.js';

export interface PreviewOpenDetail {
  preview: string;
  filename: string;
}

export interface TabletopEventHandlers {
  dismissError: () => void;
  addFiles: () => void;
  startNewBatch: () => void;
  onRotate: (e: Event) => void;
  onDelete: (e: Event) => void;
  onPreviewOpen: (e: CustomEvent<PreviewOpenDetail>) => void;
  onDragStart: (e: DragEvent, flexContainer: HTMLElement, islandId: string) => void;
  onDragOver: (e: DragEvent, flexContainer: HTMLElement, islandId: string) => void;
  onDrop: (e: DragEvent, flexContainer: HTMLElement, islandId: string) => void;
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

export function buildThumbnailsHtml(
  islands: IslandState[],
  errorBanner?: string,
  cardStyle: CardStyle = 'glass'
): string {
  const banner = errorBanner ?? '';

  let globalPageIndex = 0;
  const islandSections = islands
    .map((island) => {
      const n = island.pages.length;
      const multi = n > 1;

      const thumbs = island.pages
        .map((p) => {
          const idx = globalPageIndex++;
          return `
    <div class="thumbnail-item cursor-grab flex-shrink-0" data-page-id="${p.id}" data-island-id="${island.id}" data-index="${idx}" draggable="true">
      <file-thumbnail data-page-id="${p.id}" status="${p.status}" card-style="${cardStyle}"></file-thumbnail>
    </div>`;
        })
        .join('');

      const stackTotalAttr = multi && n > 4 ? ` data-stack-total="${n}" aria-label="${n} pages in this document"` : '';

      const flexClass = multi
        ? 'thumbnails-flex island-stack-multi w-fit max-w-full min-w-0'
        : 'thumbnails-flex flex flex-wrap gap-4 w-fit max-w-full min-w-0 justify-start content-start';

      const inner = `
      <div class="${flexClass}" data-island-id="${island.id}"${stackTotalAttr}>
        ${thumbs}
      </div>`;

      const body = multi
        ? `<div class="island-stack-wrap relative w-fit max-w-full">${inner}</div>`
        : inner;

      return `
    <section class="island w-fit max-w-full self-start rounded-xl border border-slate-200 bg-slate-50/60 p-2 shadow-sm" data-island-id="${island.id}">
      ${body}
    </section>`;
    })
    .join('');

  const addCardHtml = `
    <div data-add-card class="add-card flex flex-shrink-0 flex-col items-center justify-center w-[160px] h-[160px] self-start border-2 border-dashed border-slate-400 rounded-xl bg-slate-50 hover:border-slate-500 hover:bg-slate-100 cursor-pointer transition-all duration-200" role="button" tabindex="0" aria-label="Add more files">
      <span class="text-3xl text-slate-500">+</span>
      <span class="text-sm text-slate-600 mt-1">Add files</span>
    </div>
  `;

  return (
    banner +
    `
    <div class="islands-stack flex flex-wrap gap-6 items-start content-start p-4 overflow-auto w-full max-h-full">
      ${islandSections}
      ${addCardHtml}
    </div>
  `
  );
}

export function attachTabletopEvents(
  container: HTMLElement,
  islands: IslandState[],
  handlers: TabletopEventHandlers
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

  const flatPages = islands.flatMap((i) => i.pages);
  container.querySelectorAll('file-thumbnail').forEach((el, i) => {
    const p = flatPages[i];
    if (p) {
      el.setAttribute('preview', p.previewDataUrl ?? '');
      el.setAttribute('filename', p.filename);
      el.setAttribute('page-index', String(i + 1));
    }
  });

  container.querySelectorAll('.thumbnails-flex[data-island-id]').forEach((flexEl) => {
    const islandId = flexEl.getAttribute('data-island-id');
    if (!islandId) return;
    const flex = flexEl as HTMLElement;
    flex.querySelectorAll('.thumbnail-item[draggable="true"]').forEach((el) => {
      el.addEventListener('dragstart', (e: Event) =>
        handlers.onDragStart(e as DragEvent, flex, islandId)
      );
      el.addEventListener('dragover', (e: Event) =>
        handlers.onDragOver(e as DragEvent, flex, islandId)
      );
      el.addEventListener('drop', (e: Event) => handlers.onDrop(e as DragEvent, flex, islandId));
    });
  });

  container.querySelectorAll('file-thumbnail').forEach((el) => {
    el.addEventListener('rotate', handlers.onRotate);
    el.addEventListener('delete', handlers.onDelete);
    el.addEventListener('preview-open', handlers.onPreviewOpen as EventListener);
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
