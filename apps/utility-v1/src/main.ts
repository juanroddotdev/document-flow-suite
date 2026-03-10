import './style.css';
import { DocumentProcessor, type ProcessingPage } from '@document-flow/pdf-engine';
import '@document-flow/ui-library';

const processor = new DocumentProcessor();

interface PageState {
  id: string;
  canvas: HTMLCanvasElement;
  previewDataUrl: string;
  filename: string;
}

let state: PageState[] = [];
let nextId = 0;

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

function renderTabletopContent(container: HTMLElement): void {
  if (state.length === 0) {
    container.innerHTML = `
      <div class="text-center text-slate-500">
        <p class="text-lg font-medium">Drop files here</p>
        <p class="text-sm mt-1">HEIC, TIFF, PNG, JPG, PDF</p>
      </div>
    `;
    return;
  }

  const thumbnailsHtml = state
    .map(
      (p, i) => `
    <div class="flex-shrink-0" data-page-id="${p.id}" data-index="${i}" draggable="true">
      <file-thumbnail data-page-id="${p.id}"></file-thumbnail>
    </div>
  `
    )
    .join('');

  container.innerHTML = `
    <div class="flex flex-wrap gap-4 p-4 overflow-auto justify-center items-start content-start w-full">
      ${thumbnailsHtml}
    </div>
  `;

  container.querySelectorAll('file-thumbnail').forEach((el, i) => {
    const p = state[i];
    if (p) {
      el.setAttribute('preview', p.previewDataUrl);
      el.setAttribute('filename', p.filename);
      el.setAttribute('page-index', String(i + 1));
    }
  });

  container.querySelectorAll('[draggable="true"]').forEach((el) => {
    el.addEventListener('dragstart', handleDragStart as EventListener);
    el.addEventListener('dragover', handleDragOver as EventListener);
    el.addEventListener('drop', handleDrop as EventListener);
  });
  container.querySelectorAll('file-thumbnail').forEach((el) => {
    el.addEventListener('rotate', handleRotate);
    el.addEventListener('delete', handleDelete);
  });
}

function handleDragStart(e: DragEvent): void {
  const target = e.currentTarget as HTMLElement;
  const id = target.getAttribute('data-page-id');
  if (id) e.dataTransfer?.setData('text/plain', id);
  e.dataTransfer!.effectAllowed = 'move';
}

function handleDragOver(e: DragEvent): void {
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'move';
}

function handleDrop(e: DragEvent): void {
  e.preventDefault();
  const fromId = e.dataTransfer?.getData('text/plain');
  const toEl = (e.currentTarget as HTMLElement).closest('[data-page-id]') as HTMLElement;
  const toId = toEl?.getAttribute('data-page-id');
  if (!fromId || !toId || fromId === toId) return;
  const fromIndex = state.findIndex((p) => p.id === fromId);
  const toIndex = state.findIndex((p) => p.id === toId);
  if (fromIndex === -1 || toIndex === -1) return;
  const [removed] = state.splice(fromIndex, 1);
  state.splice(toIndex, 0, removed);
  const tabletop = document.getElementById('tabletop');
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
        <div id="tabletop" class="flex-1 min-h-96 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-white/80 hover:border-slate-400 transition-colors cursor-pointer overflow-hidden">
        </div>
      </main>
      <aside class="w-80 bg-white border-l border-slate-200 p-4 flex flex-col gap-4">
        <h2 class="font-semibold text-slate-800">Actions</h2>
        <button id="export-pdf" class="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed" ${state.length === 0 ? 'disabled' : ''}>
          Export PDF
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

      const loading = document.createElement('div');
      loading.className = 'text-slate-500';
      loading.textContent = 'Processing…';
      tabletop.appendChild(loading);

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const pages = await processor.normalizeToPages(file);
          for (let j = 0; j < pages.length; j++) {
            const p = pages[j];
            const filename = pages.length > 1 ? `${file.name} (${j + 1})` : file.name;
            state.push({
              id: `page-${nextId++}`,
              canvas: p.canvas,
              previewDataUrl: canvasToDataUrl(p.canvas),
              filename,
            });
          }
        }
        renderTabletopContent(tabletop);
        const exportBtn = document.getElementById('export-pdf');
        if (exportBtn) (exportBtn as HTMLButtonElement).disabled = false;
      } catch (err) {
        console.error(err);
        loading.textContent = `Error: ${err instanceof Error ? err.message : 'Failed to process'}`;
      } finally {
        loading.remove();
      }
    });
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
  } catch (err) {
    console.error(err);
  } finally {
    if (exportBtn) exportBtn.disabled = false;
  }
}

function initApp(): void {
  render();
}

initApp();
