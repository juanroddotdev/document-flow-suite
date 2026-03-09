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
    }
  });

  container.querySelectorAll('[draggable="true"]').forEach((el) => {
    el.addEventListener('dragstart', handleDragStart as EventListener);
    el.addEventListener('dragover', handleDragOver as EventListener);
    el.addEventListener('drop', handleDrop as EventListener);
  });
  container.querySelectorAll('file-thumbnail').forEach((el) => {
    el.addEventListener('rotate', handleRotate);
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
    a.download = `document-flow-${Date.now()}.pdf`;
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
