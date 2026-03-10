import './style.css';
import { DocumentProcessor, type ProcessingPage } from '@document-flow/pdf-engine';
import '@document-flow/ui-library';

const processor = new DocumentProcessor();

interface PageState {
  id: string;
  canvas: HTMLCanvasElement;
  previewDataUrl: string;
  filename: string;
  status: 'processing' | 'ready';
}

let state: PageState[] = [];
let nextId = 0;

let dragPlaceholder: HTMLElement | null = null;
const DRAG_GHOST_CLASS = 'opacity-50 cursor-grabbing';

function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', 0.85);
}

const INVALID_FILENAME_CHARS = /[/\\:*?"<>|]/g;

function sanitizeFilename(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  const sanitized = trimmed.replace(INVALID_FILENAME_CHARS, '_');
  return sanitized.endsWith('.pdf') ? sanitized : `${sanitized}.pdf`;
}

function getDefaultExportName(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `Standardized_Batch_${date}.pdf`;
}

function showExportModal(): Promise<string | null> {
  const defaultName = getDefaultExportName();
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    backdrop.id = 'export-modal-backdrop';

    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-xl p-6 w-full max-w-md';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'Name your document');

    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultName.replace('.pdf', '');
    input.className =
      'w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 mb-4';
    input.placeholder = 'Document name';
    input.autofocus = true;

    const btnRow = document.createElement('div');
    btnRow.className = 'flex gap-2 justify-end';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className =
      'px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50';

    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.textContent = 'Export';
    exportBtn.className = 'px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700';

    function close(result: string | null) {
      backdrop.remove();
      resolve(result);
    }

    cancelBtn.addEventListener('click', () => close(null));
    exportBtn.addEventListener('click', () => {
      const raw = input.value.trim() || defaultName.replace('.pdf', '');
      const filename = sanitizeFilename(raw) || defaultName;
      close(filename);
    });
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close(null);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') exportBtn.click();
      if (e.key === 'Escape') close(null);
    });

    const heading = document.createElement('h3');
    heading.className = 'text-lg font-semibold text-slate-800 mb-2';
    heading.textContent = 'Name your document';
    card.appendChild(heading);
    card.appendChild(input);
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(exportBtn);
    card.appendChild(btnRow);
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);
    input.focus();
    input.select();
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

const FILE_INPUT_ACCEPT =
  '.heic,.tif,.tiff,.png,.jpg,.jpeg,.pdf,image/heic,image/tiff,image/png,image/jpeg,application/pdf';

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
    <div class="flex-shrink-0 cursor-grab" data-page-id="${p.id}" data-index="${i}" draggable="true">
      <file-thumbnail data-page-id="${p.id}" status="${p.status}"></file-thumbnail>
    </div>
  `
    )
    .join('');

  container.innerHTML = `
    <div id="thumbnails-flex" class="flex flex-wrap gap-4 p-4 overflow-auto justify-center items-start content-start w-full">
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

  container.querySelectorAll('[draggable="true"]').forEach((el) => {
    el.addEventListener('dragstart', (e: Event) => handleDragStart(e as DragEvent, flexContainer));
    el.addEventListener('dragover', (e: Event) => handleDragOver(e as DragEvent, flexContainer));
    el.addEventListener('drop', (e: Event) => handleDrop(e as DragEvent, flexContainer));
    el.addEventListener('dragend', (e: Event) => handleDragEnd(e as DragEvent));
  });
  container.querySelectorAll('file-thumbnail').forEach((el) => {
    el.addEventListener('rotate', handleRotate);
    el.addEventListener('delete', handleDelete);
  });
}

function ensurePlaceholder(container: HTMLElement): HTMLElement {
  if (dragPlaceholder && dragPlaceholder.parentElement === container) return dragPlaceholder;
  if (dragPlaceholder?.parentElement) dragPlaceholder.remove();
  dragPlaceholder = document.createElement('div');
  dragPlaceholder.id = 'drop-placeholder';
  dragPlaceholder.className =
    'flex-shrink-0 w-20 h-24 border-2 border-dashed border-slate-400 rounded-lg bg-slate-100/80 pointer-events-none';
  dragPlaceholder.setAttribute('aria-hidden', 'true');
  return dragPlaceholder;
}

function handleDragStart(e: DragEvent, flexContainer: HTMLElement): void {
  const target = e.currentTarget as HTMLElement;
  const id = target.getAttribute('data-page-id');
  if (id) e.dataTransfer?.setData('text/plain', id);
  e.dataTransfer!.effectAllowed = 'move';
  target.classList.add(...DRAG_GHOST_CLASS.split(' '));
  const ph = ensurePlaceholder(flexContainer);
  if (!ph.parentElement) flexContainer.appendChild(ph);
}

function handleDragOver(e: DragEvent, flexContainer: HTMLElement): void {
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'move';
  const over = (e.target as HTMLElement).closest('[data-page-id]') as HTMLElement | null;
  const ph = flexContainer.querySelector('#drop-placeholder');
  if (!ph || !over || over === ph) return;
  const idx = Array.from(flexContainer.children).indexOf(over);
  if (idx >= 0 && flexContainer.contains(ph)) {
    const currentIdx = Array.from(flexContainer.children).indexOf(ph);
    if (currentIdx !== idx) {
      if (idx < currentIdx) flexContainer.insertBefore(ph, over);
      else flexContainer.insertBefore(ph, over.nextSibling);
    }
  }
}

function handleDrop(e: DragEvent, _flexContainer: HTMLElement): void {
  e.preventDefault();
  const fromId = e.dataTransfer?.getData('text/plain');
  const toEl = (e.currentTarget as HTMLElement).closest('[data-page-id]') as HTMLElement;
  const toId = toEl?.getAttribute('data-page-id');
  dragPlaceholder?.remove();
  dragPlaceholder = null;
  if (!fromId || !toId || fromId === toId) return;
  const fromIndex = state.findIndex((p) => p.id === fromId);
  const toIndex = state.findIndex((p) => p.id === toId);
  if (fromIndex === -1 || toIndex === -1) return;
  const [removed] = state.splice(fromIndex, 1);
  state.splice(toIndex, 0, removed);
  const tabletop = document.getElementById('tabletop');
  if (tabletop) renderTabletopContent(tabletop);
}

function handleDragEnd(e: DragEvent): void {
  const target = e.currentTarget as HTMLElement;
  target.classList.remove(...DRAG_GHOST_CLASS.split(' '));
  dragPlaceholder?.remove();
  dragPlaceholder = null;
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
