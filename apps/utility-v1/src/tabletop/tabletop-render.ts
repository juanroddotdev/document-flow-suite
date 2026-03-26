/**
 * Tabletop DOM builders and event attachment for the document flow app.
 */

import { escapeHtml } from '../utils/html.js';
import type { IslandState, PageState } from '../app-state.js';
import { flattenPagesInIslandOrder } from '../app-state.js';

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
  onToggleIslandExpand: (islandId: string) => void;
}

/** Expand / show all pages (collapsed stack with >4 pages). */
const ICON_EXPAND = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;

/** Collapse back to stacked first four. */
const ICON_COLLAPSE = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v3a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2V3m0 18v-3a2 2 0 0 0-2-2h-3a2 2 0 0 0-2 2v3M3 8h3a2 2 0 0 0 2-2V3m18 0h-3a2 2 0 0 0-2 2v3"/></svg>`;

function buildErrorBanner(errorMessage: string): string {
  return `<div class="flex items-center justify-between gap-4 px-4 py-2 bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-800/80 text-red-800 dark:text-red-200 text-sm" role="alert">
    <span>${escapeHtml(errorMessage)}</span>
    <button type="button" data-dismiss-error class="text-red-600 dark:text-red-300 hover:text-red-800 dark:hover:text-red-100 font-medium" aria-label="Dismiss">Dismiss</button>
  </div>`;
}

export function buildEmptyDropzoneHtml(errorBanner?: string): string {
  const banner = errorBanner ?? '';
  return (
    banner +
    `
    <div class="text-center text-slate-500 dark:text-slate-400 empty-dropzone-content">
      <p class="text-xl font-semibold text-slate-600 dark:text-slate-200">Drop Files Anywhere</p>
      <p class="text-sm mt-2">or click to browse</p>
      <p class="text-xs mt-3 text-slate-400 dark:text-slate-500">HEIC, TIFF, PNG, JPG, PDF</p>
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
      <p class="text-xl font-semibold text-slate-700 dark:text-slate-200">Download Started!</p>
      <button type="button" id="start-new-batch" class="px-4 py-2 bg-slate-800 dark:bg-slate-200 dark:text-slate-900 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-white">
        Start New Batch
      </button>
    </div>
  `
  );
}

export type CardStyle = 'glass' | 'capsule' | 'action-first';

function buildThumbItems(
  pages: PageState[],
  islandId: string,
  cardStyle: CardStyle,
  globalIdxByPageId: Map<string, number>
): string {
  return pages
    .map((p) => {
      const idx = globalIdxByPageId.get(p.id) ?? 0;
      return `
    <div class="thumbnail-item cursor-grab flex-shrink-0" data-page-id="${p.id}" data-island-id="${islandId}" data-index="${idx}" draggable="true">
      <file-thumbnail data-page-id="${p.id}" status="${p.status}" card-style="${cardStyle}"></file-thumbnail>
    </div>`;
    })
    .join('');
}

export function buildThumbnailsHtml(
  islands: IslandState[],
  errorBanner?: string,
  cardStyle: CardStyle = 'glass'
): string {
  const banner = errorBanner ?? '';
  const flat = flattenPagesInIslandOrder(islands);
  const globalIdxByPageId = new Map(flat.map((p, i) => [p.id, i]));

  const islandSections = islands
    .map((island) => {
      const n = island.pages.length;
      const expanded = island.expanded === true;

      /** Single page: simple flex tile */
      if (n === 1) {
        const thumbs = buildThumbItems(island.pages, island.id, cardStyle, globalIdxByPageId);
        const inner = `
      <div class="thumbnails-flex flex flex-wrap gap-4 w-fit max-w-full min-w-0 justify-start content-start" data-island-id="${island.id}">
        ${thumbs}
      </div>`;
        return `
    <section class="island w-fit max-w-full self-start rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/60 dark:bg-slate-900/50 p-2 shadow-sm" data-island-id="${island.id}">
      ${inner}
    </section>`;
      }

      /** 2–4 pages: stacked deck (all visible) */
      if (n <= 4) {
        const thumbs = buildThumbItems(island.pages, island.id, cardStyle, globalIdxByPageId);
        const inner = `
      <div class="thumbnails-flex island-stack-multi w-fit max-w-full min-w-0" data-island-id="${island.id}">
        ${thumbs}
      </div>`;
        return `
    <section class="island w-fit max-w-full self-start rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/60 dark:bg-slate-900/50 p-2 shadow-sm" data-island-id="${island.id}">
      <div class="island-stack-wrap relative w-fit max-w-full">${inner}</div>
    </section>`;
      }

      /** 5+ pages, collapsed: first 4 stacked + expand */
      if (!expanded) {
        const visible = island.pages.slice(0, 4);
        const thumbs = buildThumbItems(visible, island.id, cardStyle, globalIdxByPageId);
        const stackTotalAttr = ` data-stack-total="${n}" aria-label="${n} pages in this document"`;
        const expandBtn = `
      <button type="button" class="island-expand-toggle" data-toggle-island-expand="${island.id}" aria-expanded="false" aria-label="Show all ${n} pages">
        ${ICON_EXPAND}
        <span class="island-expand-toggle-label">Show all</span>
      </button>`;
        const inner = `
      <div class="thumbnails-flex island-stack-multi w-fit max-w-full min-w-0" data-island-id="${island.id}"${stackTotalAttr}>
        ${thumbs}
      </div>
      ${expandBtn}`;
        return `
    <section class="island w-fit max-w-full self-start rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/60 dark:bg-slate-900/50 p-2 shadow-sm" data-island-id="${island.id}">
      <div class="island-stack-wrap island-stack-wrap--with-toggle relative w-fit max-w-full flex flex-col items-center gap-2">${inner}</div>
    </section>`;
      }

      /** 5+ pages, expanded: 4-column grid + collapse */
      const thumbs = buildThumbItems(island.pages, island.id, cardStyle, globalIdxByPageId);
      const collapseBtn = `
      <button type="button" class="island-expand-toggle" data-toggle-island-expand="${island.id}" aria-expanded="true" aria-label="Show stacked preview only">
        ${ICON_COLLAPSE}
        <span class="island-expand-toggle-label">Stack</span>
      </button>`;
      const inner = `
      <div class="thumbnails-flex island-stack-expanded w-fit max-w-full min-w-0" data-island-id="${island.id}">
        ${thumbs}
      </div>
      ${collapseBtn}`;
      return `
    <section class="island w-fit max-w-full self-start rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/60 dark:bg-slate-900/50 p-2 shadow-sm" data-island-id="${island.id}">
      <div class="island-stack-wrap island-stack-wrap--with-toggle relative w-fit max-w-full flex flex-col items-stretch gap-2">${inner}</div>
    </section>`;
    })
    .join('');

  const addCardHtml = `
    <div data-add-card class="add-card flex flex-shrink-0 flex-col items-center justify-center w-[160px] h-[160px] self-start border-2 border-dashed border-slate-400 dark:border-slate-500 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:border-slate-500 dark:hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all duration-200" role="button" tabindex="0" aria-label="Add more files">
      <span class="text-3xl text-slate-500 dark:text-slate-400">+</span>
      <span class="text-sm text-slate-600 dark:text-slate-300 mt-1">Add files</span>
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

  const flatPages = flattenPagesInIslandOrder(islands);
  const pageById = new Map(flatPages.map((p, i) => [p.id, { page: p, globalIndex: i }]));
  container.querySelectorAll('file-thumbnail').forEach((el) => {
    const id = el.getAttribute('data-page-id');
    const entry = id ? pageById.get(id) : undefined;
    if (!entry) return;
    el.setAttribute('preview', entry.page.previewDataUrl ?? '');
    el.setAttribute('filename', entry.page.filename);
    el.setAttribute('page-index', String(entry.globalIndex + 1));
  });

  container.querySelectorAll('[data-toggle-island-expand]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-toggle-island-expand');
      if (id) handlers.onToggleIslandExpand(id);
    });
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
      tabletop.classList.add('border-slate-500', 'dark:border-slate-400', 'bg-slate-50', 'dark:bg-slate-900/60');
    }
  });
  tabletop.addEventListener('dragleave', (e) => {
    if (!tabletop.contains((e as DragEvent).relatedTarget as Node)) {
      tabletop.classList.remove('border-slate-500', 'dark:border-slate-400', 'bg-slate-50', 'dark:bg-slate-900/60');
    }
  });
  tabletop.addEventListener('drop', async (e: Event) => {
    const ev = e as DragEvent;
    tabletop.classList.remove('border-slate-500', 'dark:border-slate-400', 'bg-slate-50', 'dark:bg-slate-900/60');
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
  progressWrap.className =
    'w-full px-4 py-2 bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700';
  progressWrap.innerHTML = `
    <p class="text-sm font-medium text-slate-600 dark:text-slate-300 progress-text">Processing…</p>
    <div class="mt-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div class="progress-fill h-full bg-slate-600 dark:bg-slate-300 rounded-full transition-all duration-200" style="width: 0%"></div>
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
