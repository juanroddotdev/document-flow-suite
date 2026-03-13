import './style.css';
import { DocumentProcessor, type ProcessingPage } from '@document-flow/pdf-engine';
import '@document-flow/ui-library';
import './components/export-modal.js';
import type { PageState } from './app-state.js';
import { FILE_INPUT_ACCEPT, getDefaultExportName } from './app-state.js';

const processor = new DocumentProcessor();

let state: PageState[] = [];
let nextId = 0;

let dragPlaceholder: HTMLElement | null = null;
let lastDropIndex = -1;

function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', 0.85);
}

function showExportModal(): Promise<string | null> {
  const modal = document.getElementById('export-modal') as HTMLElement & { defaultFilename: string; open: boolean };
  if (!modal) return Promise.resolve(null);
  modal.defaultFilename = getDefaultExportName();
  modal.open = true;
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (result: string | null) => {
      if (resolved) return;
      resolved = true;
      modal.open = false;
      modal.removeEventListener('export-name', onExportName);
      modal.removeEventListener('close', onClose);
      resolve(result);
    };
    const onExportName = (e: Event) => finish((e as CustomEvent<string>).detail);
    const onClose = () => finish(null);
    modal.addEventListener('export-name', onExportName);
    modal.addEventListener('close', onClose);
  });
}

function rotateCanvas90(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = canvas.height;
  out.height = canvas.width;
  const ctx = out.getContext('2d');
  if (!ctx) return canvas;
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  return out;
}

async function processAndAddFiles(files: FileList, tabletop: HTMLElement): Promise<void> {
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
  tabletop.prepend(progressWrap);
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (progressText) progressText.textContent = `Processing file ${i + 1} of ${files.length}`;
      if (progressFill) progressFill.style.width = `${((i + 1) / files.length) * 100}%`;
      const pages = await processor.normalizeToPages(file);
      for (let j = 0; j < pages.length; j++) {
        const p = pages[j];
        const filename = pages.length > 1 ? `${file.name} (${j + 1})` : file.name;
        state.push({
          id: `page-${nextId++}`,
          canvas: p.canvas,
          previewDataUrl: canvasToDataUrl(p.canvas),
          filename,
          status: 'processing',
        });
      }
    }
    state.forEach((p) => (p.status = 'ready'));
    renderTabletopContent(tabletop);
    const exportBtn = document.getElementById('export-pdf');
    if (exportBtn) (exportBtn as HTMLButtonElement).disabled = false;
  } catch (err) {
    console.error(err);
    if (progressText) progressText.textContent = `Error: ${err instanceof Error ? err.message : 'Failed to process'}`;
  } finally {
    progressWrap.remove();
  }
}

function renderTabletopContent(container: HTMLElement): void {
  if (state.length === 0) {
    container.innerHTML = `
      <div class="text-center text-slate-500 empty-dropzone-content">
        <p class="text-xl font-semibold text-slate-600">Drop Files Anywhere</p>
        <p class="text-sm mt-2">or click to browse</p>
        <p class="text-xs mt-3 text-slate-400">HEIC, TIFF, PNG, JPG, PDF</p>
      </div>
    `;
    return;
  }

  const thumbnailsHtml = state
    .map(
      (p, i) => `
    <div class="thumbnail-item cursor-grab" data-page-id="${p.id}" data-index="${i}" draggable="true">
      <file-thumbnail data-page-id="${p.id}" status="${p.status}"></file-thumbnail>
    </div>
  `
    )
    .join('');

  container.innerHTML = `
    <div id="thumbnails-flex" class="grid gap-4 p-4 overflow-auto w-full" style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); justify-items: center; align-content: start;">
      ${thumbnailsHtml}
    </div>
  `;

  const flexContainer = container.querySelector('#thumbnails-flex') as HTMLElement;
  container.querySelectorAll('file-thumbnail').forEach((el, i) => {
    const p = state[i];
    if (p) {
      el.setAttribute('preview', p.previewDataUrl);
      el.setAttribute('filename', p.filename);
      el.setAttribute('page-index', String(i + 1));
    }
  });

  const tabletop = document.getElementById('tabletop');
  container.querySelectorAll('[draggable="true"]').forEach((el) => {
    el.addEventListener('dragstart', (e: Event) => handleDragStart(e as DragEvent, flexContainer, tabletop));
    el.addEventListener('dragover', (e: Event) => handleDragOver(e as DragEvent, flexContainer));
    el.addEventListener('drop', (e: Event) => handleDrop(e as DragEvent, flexContainer, tabletop));
  });
  container.querySelectorAll('file-thumbnail').forEach((el) => {
    el.addEventListener('rotate', handleRotate);
    el.addEventListener('delete', handleDelete);
  });
}

function ensurePlaceholder(container: HTMLElement, widthPx: number, heightPx: number): HTMLElement {
  if (dragPlaceholder && dragPlaceholder.parentElement === container) {
    dragPlaceholder.style.width = `${widthPx}px`;
    dragPlaceholder.style.height = `${heightPx}px`;
    return dragPlaceholder;
  }
  if (dragPlaceholder?.parentElement) dragPlaceholder.remove();
  dragPlaceholder = document.createElement('div');
  dragPlaceholder.id = 'drop-placeholder';
  dragPlaceholder.className =
    'flex-shrink-0 border-2 border-dashed border-slate-400 rounded-lg bg-slate-100/80 rounded-lg';
  dragPlaceholder.style.width = `${widthPx}px`;
  dragPlaceholder.style.height = `${heightPx}px`;
  dragPlaceholder.style.minWidth = `${widthPx}px`;
  dragPlaceholder.setAttribute('aria-hidden', 'true');
  return dragPlaceholder;
}

function handleDragStart(e: DragEvent, flexContainer: HTMLElement, tabletop: HTMLElement | null): void {
  const target = e.currentTarget as HTMLElement;
  const id = target.getAttribute('data-page-id');
  if (id) e.dataTransfer?.setData('text/plain', id);
  e.dataTransfer!.effectAllowed = 'move';

  const rect = target.getBoundingClientRect();
  const ph = ensurePlaceholder(flexContainer, rect.width, rect.height);
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
      lastDropIndex = -1;
      dragPlaceholder?.remove();
      dragPlaceholder = null;
      const t = document.getElementById('tabletop');
      if (t) renderTabletopContent(t);
    },
    { once: true, capture: true }
  );

  ph.addEventListener('dragover', (ev: Event) => handleDragOver(ev as DragEvent, flexContainer));
  ph.addEventListener('drop', (ev: Event) => handleDrop(ev as DragEvent, flexContainer, tabletop));
}

function handleDragOver(e: DragEvent, flexContainer: HTMLElement): void {
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
  if (newPhIndex === lastDropIndex) return;
  lastDropIndex = newPhIndex;

  const targetEl = flexContainer.children[newPhIndex];
  if (targetEl && targetEl !== ph) {
    flexContainer.insertBefore(ph, targetEl);
  }
}

function handleDrop(e: DragEvent, flexContainer: HTMLElement, tabletop: HTMLElement | null): void {
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
      dragPlaceholder?.remove();
      dragPlaceholder = null;
      return;
    }
    toIndex = state.findIndex((p) => p.id === toId);
  }
  lastDropIndex = -1;
  dragPlaceholder?.remove();
  dragPlaceholder = null;
  if (!fromId || toIndex === -1) return;
  const fromIndex = state.findIndex((p) => p.id === fromId);
  if (fromIndex === -1) return;
  const [removed] = state.splice(fromIndex, 1);
  state.splice(toIndex, 0, removed);
  if (tabletop) renderTabletopContent(tabletop);
}

function handleRotate(e: Event): void {
  const target = e.target as HTMLElement;
  const wrapper = target.closest('[data-page-id]') as HTMLElement;
  const id = wrapper?.getAttribute('data-page-id');
  if (!id) return;
  const page = state.find((p) => p.id === id);
  if (!page) return;
  page.canvas = rotateCanvas90(page.canvas);
  page.previewDataUrl = canvasToDataUrl(page.canvas);
  const tabletop = document.getElementById('tabletop');
  if (tabletop) renderTabletopContent(tabletop);
}

function handleDelete(e: Event): void {
  const target = e.target as HTMLElement;
  const wrapper = target.closest('[data-page-id]') as HTMLElement;
  const id = wrapper?.getAttribute('data-page-id');
  if (!id) return;
  state = state.filter((p) => p.id !== id);
  const tabletop = document.getElementById('tabletop');
  if (tabletop) renderTabletopContent(tabletop);
  const exportBtn = document.getElementById('export-pdf') as HTMLButtonElement | null;
  if (exportBtn) exportBtn.disabled = state.length === 0;
}

function render(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="flex h-screen bg-slate-100">
      <main class="flex-1 flex flex-col p-8 min-w-0">
        <input type="file" id="file-picker" multiple accept="${FILE_INPUT_ACCEPT}" class="hidden" />
        <div id="tabletop" class="flex-1 min-h-[50vh] border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-white/80 hover:border-slate-400 transition-colors cursor-pointer overflow-hidden">
        </div>
      </main>
      <aside class="w-80 bg-white border-l border-slate-200 p-4 flex flex-col gap-4">
        <h2 class="font-semibold text-slate-800">Actions</h2>
        <button id="export-pdf" class="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed" ${state.length === 0 ? 'disabled' : ''}>
          Create 1 Combined PDF
        </button>
        <p class="text-sm text-slate-500 mt-auto">DocumentFlow Suite v1</p>
      </aside>
    </div>
    <export-modal id="export-modal"></export-modal>
  `;

  const tabletop = document.getElementById('tabletop');
  if (tabletop) {
    renderTabletopContent(tabletop);

    tabletop.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!e.dataTransfer?.types.includes('text/plain')) {
        tabletop.classList.add('border-slate-500', 'bg-slate-50');
      }
    });
    tabletop.addEventListener('dragleave', (e) => {
      if (!tabletop.contains(e.relatedTarget as Node)) {
        tabletop.classList.remove('border-slate-500', 'bg-slate-50');
      }
    });
    tabletop.addEventListener('drop', async (e) => {
      tabletop.classList.remove('border-slate-500', 'bg-slate-50');
      const files = e.dataTransfer?.files;
      if (!files?.length) return;
      e.preventDefault();
      await processAndAddFiles(files, tabletop);
    });

    tabletop.addEventListener('click', (e) => {
      if (state.length !== 0) return;
      const target = e.target as HTMLElement;
      if (!tabletop.contains(target)) return;
      const picker = document.getElementById('file-picker') as HTMLInputElement | null;
      if (picker) picker.click();
    });

    const filePicker = document.getElementById('file-picker') as HTMLInputElement | null;
    if (filePicker) {
      filePicker.addEventListener('change', async () => {
        const files = filePicker.files;
        if (!files?.length) return;
        await processAndAddFiles(files, tabletop);
        filePicker.value = '';
      });
    }
  }

  const exportBtn = document.getElementById('export-pdf');
  if (exportBtn) {
    exportBtn.replaceWith(exportBtn.cloneNode(true));
    document.getElementById('export-pdf')?.addEventListener('click', handleExport);
  }
}

async function handleExport(): Promise<void> {
  if (state.length === 0) return;
  const exportBtn = document.getElementById('export-pdf') as HTMLButtonElement;
  if (exportBtn) exportBtn.disabled = true;
  const filename = await showExportModal();
  if (!filename) {
    if (exportBtn) exportBtn.disabled = false;
    return;
  }
  try {
    const pages: ProcessingPage[] = state.map((p, i) => ({
      canvas: p.canvas,
      order: i,
    }));
    const bytes = await processor.generateStapledPDF(pages);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showSuccessState();
  } catch (err) {
    console.error(err);
  } finally {
    if (exportBtn) exportBtn.disabled = false;
  }
}

function showSuccessState(): void {
  const tabletop = document.getElementById('tabletop');
  if (!tabletop) return;
  tabletop.innerHTML = `
    <div class="flex flex-col items-center justify-center gap-4 text-center p-8">
      <p class="text-xl font-semibold text-slate-700">Download Started!</p>
      <button type="button" id="start-new-batch" class="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
        Start New Batch
      </button>
    </div>
  `;
  document.getElementById('start-new-batch')?.addEventListener('click', startNewBatch);
}

function startNewBatch(): void {
  state = [];
  const tabletop = document.getElementById('tabletop');
  if (tabletop) renderTabletopContent(tabletop);
  const exportBtn = document.getElementById('export-pdf') as HTMLButtonElement | null;
  if (exportBtn) exportBtn.disabled = true;
}

function initApp(): void {
  render();
}

initApp();
