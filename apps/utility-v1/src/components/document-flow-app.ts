import { LitElement, html } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import {
  DocumentProcessor,
  type ProcessingPage,
  isHeic,
  isDocumentFlowError,
} from '@document-flow/pdf-engine';
import type { PageState } from '../app-state.js';
import {
  VIRTUAL_ITEM_SIZE,
  VIRTUAL_GAP,
  VIRTUAL_ROW_HEIGHT,
  FILE_INPUT_ACCEPT,
  getDefaultExportName,
  blobToPreviewDataUrl,
  blobToCanvas,
  rotateBlob90,
} from '../app-state.js';

type NormalizeWorkerApi = { normalizeFile: (file: File) => Promise<Blob[]> };

@customElement('document-flow-app')
export class DocumentFlowApp extends LitElement {
  override createRenderRoot(): HTMLElement {
    return this;
  }

  @state() pages: PageState[] = [];
  @state() showSuccess = false;
  @state() exportModalOpen = false;
  @state() errorMessage: string | null = null;
  @query('#tabletop') tabletopEl!: HTMLElement;
  @query('#file-picker') filePickerEl!: HTMLInputElement;
  @query('#export-pdf') exportBtnEl!: HTMLButtonElement;

  private nextId = 0;
  private processor = new DocumentProcessor();
  private workerApi: NormalizeWorkerApi | null = null;
  private dragPlaceholder: HTMLElement | null = null;
  private lastDropIndex = -1;
  private virtualScrollContainer: HTMLElement | null = null;
  private virtualVisibleLayer: HTMLElement | null = null;
  private virtualResizeObserver: ResizeObserver | null = null;

  private async getWorkerApi(): Promise<NormalizeWorkerApi> {
    if (this.workerApi) return this.workerApi;
    const worker = new Worker(new URL('../normalize.worker.ts', import.meta.url), { type: 'module' });
    const Comlink = await import('comlink');
    this.workerApi = Comlink.wrap(worker) as NormalizeWorkerApi;
    return this.workerApi;
  }

  private async getNormalizedBlobs(file: File): Promise<Blob[]> {
    if (isHeic(file)) {
      const pages = await this.processor.normalizeToPages(file);
      const blobs: Blob[] = [];
      for (const p of pages) {
        const blob = await new Promise<Blob>((resolve, reject) => {
          p.canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png', 0.9);
        });
        blobs.push(blob);
      }
      return blobs;
    }
    const api = await this.getWorkerApi();
    return api.normalizeFile(file);
  }

  private getVisibleRange(container: HTMLElement): { start: number; end: number; cols: number } {
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 400;
    const cols = Math.max(1, Math.floor((w + VIRTUAL_GAP) / (VIRTUAL_ITEM_SIZE + VIRTUAL_GAP)));
    const scrollTop = container.scrollTop;
    const startRow = Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT);
    const visibleRows = Math.ceil(h / VIRTUAL_ROW_HEIGHT) + 1;
    const start = Math.max(0, startRow * cols);
    const end = Math.min(this.pages.length, (startRow + visibleRows) * cols);
    return { start, end, cols };
  }

  private ensurePreviewForIndex(index: number): void {
    const p = this.pages[index];
    if (!p || p.previewDataUrl) return;
    blobToPreviewDataUrl(p.blob).then((dataUrl) => {
      p.previewDataUrl = dataUrl;
      this.updateVisibleThumbnails();
    });
  }

  private updateVisibleThumbnails(): void {
    if (!this.virtualVisibleLayer || !this.virtualScrollContainer) return;
    const { start, end, cols } = this.getVisibleRange(this.virtualScrollContainer);
    this.virtualVisibleLayer.innerHTML = '';
    const tabletop = this.tabletopEl;
    for (let i = start; i < end; i++) {
      const p = this.pages[i];
      const row = Math.floor(i / cols);
      const col = i % cols;
      const left = col * (VIRTUAL_ITEM_SIZE + VIRTUAL_GAP);
      const top = row * VIRTUAL_ROW_HEIGHT;
      const wrapper = document.createElement('div');
      wrapper.className = 'thumbnail-item cursor-grab absolute';
      wrapper.style.width = `${VIRTUAL_ITEM_SIZE}px`;
      wrapper.style.height = `${VIRTUAL_ITEM_SIZE}px`;
      wrapper.style.left = `${left}px`;
      wrapper.style.top = `${top}px`;
      wrapper.setAttribute('data-page-id', p.id);
      wrapper.setAttribute('data-index', String(i));
      wrapper.draggable = true;
      const thumb = document.createElement('file-thumbnail');
      thumb.setAttribute('data-page-id', p.id);
      thumb.setAttribute('status', p.status);
      thumb.setAttribute('filename', p.filename);
      thumb.setAttribute('page-index', String(i + 1));
      thumb.setAttribute('preview', p.previewDataUrl ?? '');
      wrapper.appendChild(thumb);
      this.virtualVisibleLayer.appendChild(wrapper);
      wrapper.addEventListener('dragstart', (e: Event) =>
        this.handleDragStart(e as DragEvent, this.virtualVisibleLayer!, tabletop)
      );
      wrapper.addEventListener('dragover', (e: Event) =>
        this.handleDragOver(e as DragEvent, this.virtualVisibleLayer!)
      );
      wrapper.addEventListener('drop', (e: Event) =>
        this.handleDrop(e as DragEvent, this.virtualVisibleLayer!, tabletop)
      );
      thumb.addEventListener('rotate', (e: Event) => this.handleRotate(e));
      thumb.addEventListener('delete', (e: Event) => this.handleDelete(e));
      this.ensurePreviewForIndex(i);
    }
  }

  private ensurePlaceholder(container: HTMLElement, widthPx: number, heightPx: number): HTMLElement {
    if (this.dragPlaceholder && this.dragPlaceholder.parentElement === container) {
      this.dragPlaceholder.style.width = `${widthPx}px`;
      this.dragPlaceholder.style.height = `${heightPx}px`;
      return this.dragPlaceholder;
    }
    if (this.dragPlaceholder?.parentElement) this.dragPlaceholder.remove();
    this.dragPlaceholder = document.createElement('div');
    this.dragPlaceholder.id = 'drop-placeholder';
    this.dragPlaceholder.className =
      'flex-shrink-0 border-2 border-dashed border-slate-400 rounded-lg bg-slate-100/80';
    this.dragPlaceholder.style.width = `${widthPx}px`;
    this.dragPlaceholder.style.height = `${heightPx}px`;
    this.dragPlaceholder.style.minWidth = `${widthPx}px`;
    this.dragPlaceholder.setAttribute('aria-hidden', 'true');
    return this.dragPlaceholder;
  }

  private handleDragStart(e: DragEvent, flexContainer: HTMLElement, tabletop: HTMLElement | null): void {
    const target = e.currentTarget as HTMLElement;
    const id = target.getAttribute('data-page-id');
    if (id) e.dataTransfer?.setData('text/plain', id);
    e.dataTransfer!.effectAllowed = 'move';
    const fromIndex = id ? this.pages.findIndex((p) => p.id === id) : -1;
    const rect = target.getBoundingClientRect();
    const ph = this.ensurePlaceholder(flexContainer, rect.width, rect.height);
    ph.setAttribute('data-state-index', String(Math.max(0, fromIndex)));
    flexContainer.insertBefore(ph, target);
    target.setAttribute('data-dragging', 'true');
    target.style.position = 'absolute';
    target.style.left = `${rect.left}px`;
    target.style.top = `${rect.top}px`;
    target.style.opacity = '0';
    target.style.pointerEvents = 'none';
    const onDragEnd = () => {
      this.lastDropIndex = -1;
      this.dragPlaceholder?.remove();
      this.dragPlaceholder = null;
      if (this.tabletopEl) this.renderTabletopContent(this.tabletopEl);
    };
    document.addEventListener('dragend', onDragEnd, { once: true, capture: true });
    ph.addEventListener('dragover', (ev: Event) => this.handleDragOver(ev as DragEvent, flexContainer));
    ph.addEventListener('drop', (ev: Event) => this.handleDrop(ev as DragEvent, flexContainer, tabletop));
  }

  private handleDragOver(e: DragEvent, flexContainer: HTMLElement): void {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    const ph = flexContainer.querySelector('#drop-placeholder') as HTMLElement | null;
    if (!ph) return;
    const over = (e.target as HTMLElement).closest('[data-page-id]') as HTMLElement | null;
    if ((e.target as HTMLElement).closest('#drop-placeholder') || !over) return;
    const overStateIndex = parseInt(over.getAttribute('data-index') ?? '-1', 10);
    if (overStateIndex < 0 || overStateIndex === parseInt(ph.getAttribute('data-state-index') ?? '-1', 10)) return;
    if (overStateIndex === this.lastDropIndex) return;
    this.lastDropIndex = overStateIndex;
    ph.setAttribute('data-state-index', String(overStateIndex));
    const targetEl = Array.from(flexContainer.children).find(
      (el) => (el as HTMLElement).getAttribute('data-index') === String(overStateIndex)
    );
    if (targetEl && targetEl !== ph) flexContainer.insertBefore(ph, targetEl);
  }

  private handleDrop(e: DragEvent, _flexContainer: HTMLElement, tabletop: HTMLElement | null): void {
    e.preventDefault();
    const fromId = e.dataTransfer?.getData('text/plain');
    const currentTarget = e.currentTarget as HTMLElement;
    let toIndex: number;
    if (currentTarget.id === 'drop-placeholder') {
      toIndex = parseInt(currentTarget.getAttribute('data-state-index') ?? '0', 10);
    } else {
      const toEl = currentTarget.closest('[data-page-id]') as HTMLElement;
      const toId = toEl?.getAttribute('data-page-id');
      if (!toId || fromId === toId) {
        this.dragPlaceholder?.remove();
        this.dragPlaceholder = null;
        return;
      }
      toIndex = this.pages.findIndex((p) => p.id === toId);
    }
    this.lastDropIndex = -1;
    this.dragPlaceholder?.remove();
    this.dragPlaceholder = null;
    if (!fromId || toIndex === -1) return;
    const fromIndex = this.pages.findIndex((p) => p.id === fromId);
    if (fromIndex === -1) return;
    const next = [...this.pages];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    this.pages = next;
    if (tabletop) this.renderTabletopContent(tabletop);
  }

  private async handleRotate(e: Event): Promise<void> {
    const wrapper = (e.target as HTMLElement).closest('[data-page-id]') as HTMLElement;
    const id = wrapper?.getAttribute('data-page-id');
    if (!id) return;
    const page = this.pages.find((p) => p.id === id);
    if (!page) return;
    page.blob = await rotateBlob90(page.blob);
    page.rotation = ((page.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    page.previewDataUrl = await blobToPreviewDataUrl(page.blob);
    this.pages = [...this.pages];
    if (this.tabletopEl) this.renderTabletopContent(this.tabletopEl);
  }

  private handleDelete(e: Event): void {
    const id = (e.target as HTMLElement).closest('[data-page-id]')?.getAttribute('data-page-id');
    if (!id) return;
    this.pages = this.pages.filter((p) => p.id !== id);
    if (this.tabletopEl) this.renderTabletopContent(this.tabletopEl);
    this.requestUpdate();
  }

  renderTabletopContent(container: HTMLElement): void {
    if (this.pages.length === 0) {
      container.innerHTML = `
        <div class="text-center text-slate-500 empty-dropzone-content">
          <p class="text-xl font-semibold text-slate-600">Drop Files Anywhere</p>
          <p class="text-sm mt-2">or click to browse</p>
          <p class="text-xs mt-3 text-slate-400">HEIC, TIFF, PNG, JPG, PDF</p>
        </div>
      `;
      if (this.virtualResizeObserver) {
        this.virtualResizeObserver.disconnect();
        this.virtualResizeObserver = null;
      }
      this.virtualScrollContainer = null;
      this.virtualVisibleLayer = null;
      return;
    }
    const { cols } = this.getVisibleRange(container);
    const totalRows = Math.ceil(this.pages.length / cols);
    const totalHeight = totalRows * VIRTUAL_ROW_HEIGHT + VIRTUAL_GAP;
    container.innerHTML = `
      <div id="thumbnails-scroll" class="w-full overflow-auto p-4" style="min-height: 200px;">
        <div id="thumbnails-inner" style="position: relative; width: 100%; height: ${totalHeight}px;">
          <div id="thumbnails-visible" style="position: absolute; inset: 0; width: 100%;"></div>
        </div>
      </div>
    `;
    this.virtualScrollContainer = container.querySelector('#thumbnails-scroll') as HTMLElement;
    this.virtualVisibleLayer = container.querySelector('#thumbnails-visible') as HTMLElement;
    const onScrollOrResize = () => this.updateVisibleThumbnails();
    this.virtualScrollContainer.addEventListener('scroll', onScrollOrResize);
    this.virtualResizeObserver = new ResizeObserver(onScrollOrResize);
    this.virtualResizeObserver.observe(this.virtualScrollContainer);
    this.updateVisibleThumbnails();
  }

  private async processAndAddFiles(files: FileList): Promise<void> {
    const tabletop = this.tabletopEl;
    if (!tabletop) return;
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
    this.errorMessage = null;
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (progressText) progressText.textContent = `Processing file ${i + 1} of ${files.length}`;
        if (progressFill) progressFill.style.width = `${((i + 1) / files.length) * 100}%`;
        const blobs = await this.getNormalizedBlobs(file);
        const next = [...this.pages];
        for (let j = 0; j < blobs.length; j++) {
          next.push({
            id: `page-${this.nextId++}`,
            blob: blobs[j],
            filename: blobs.length > 1 ? `${file.name} (${j + 1})` : file.name,
            status: 'processing',
            rotation: 0,
          });
        }
        this.pages = next;
      }
      this.pages = this.pages.map((p) => ({ ...p, status: 'ready' as const }));
      this.renderTabletopContent(tabletop);
      this.requestUpdate();
    } catch (err) {
      const msg =
        isDocumentFlowError(err) || err instanceof Error
          ? err.message
          : 'Failed to process file. Try a different file or format.';
      this.errorMessage = msg;
      if (progressText) progressText.textContent = `Error: ${msg}`;
      this.requestUpdate();
    } finally {
      progressWrap.remove();
    }
  }

  private handleExportClick(): void {
    if (this.pages.length === 0) return;
    this.exportModalOpen = true;
    if (this.exportBtnEl) this.exportBtnEl.disabled = true;
    this.requestUpdate();
  }

  private onExportModalClose(): void {
    this.exportModalOpen = false;
    if (this.exportBtnEl) this.exportBtnEl.disabled = this.pages.length === 0;
    this.requestUpdate();
  }

  private async onExportName(e: CustomEvent<string>): Promise<void> {
    const filename = e.detail;
    if (!filename) return;
    this.exportModalOpen = false;
    if (this.exportBtnEl) this.exportBtnEl.disabled = true;
    try {
      const pages: ProcessingPage[] = [];
      for (let i = 0; i < this.pages.length; i++) {
        const canvas = await blobToCanvas(this.pages[i].blob);
        pages.push({ canvas, order: i });
      }
      const bytes = await this.processor.generateStapledPDF(pages);
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      this.showSuccess = true;
      this.errorMessage = null;
      this.requestUpdate();
    } catch (err) {
      const msg =
        isDocumentFlowError(err) || err instanceof Error
          ? err.message
          : 'Export failed. Try again or reduce the number of pages.';
      this.errorMessage = msg;
      this.requestUpdate();
    } finally {
      if (this.exportBtnEl) this.exportBtnEl.disabled = false;
      this.requestUpdate();
    }
  }

  private startNewBatch(): void {
    this.pages = [];
    this.showSuccess = false;
    this.errorMessage = null;
    if (this.tabletopEl) this.renderTabletopContent(this.tabletopEl);
    this.requestUpdate();
  }

  override firstUpdated(): void {
    const tabletop = this.querySelector('#tabletop') as HTMLElement;
    if (tabletop) {
      this.renderTabletopContent(tabletop);
      tabletop.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!(e as DragEvent).dataTransfer?.types.includes('text/plain'))
          tabletop.classList.add('border-slate-500', 'bg-slate-50');
      });
      tabletop.addEventListener('dragleave', (e) => {
        if (!tabletop.contains((e as DragEvent).relatedTarget as Node))
          tabletop.classList.remove('border-slate-500', 'bg-slate-50');
      });
      tabletop.addEventListener('drop', async (e: Event) => {
        const ev = e as DragEvent;
        tabletop.classList.remove('border-slate-500', 'bg-slate-50');
        if (!ev.dataTransfer?.files?.length) return;
        ev.preventDefault();
        await this.processAndAddFiles(ev.dataTransfer.files);
      });
      tabletop.addEventListener('click', (e) => {
        if (this.pages.length !== 0) return;
        if (!tabletop.contains(e.target as Node)) return;
        (this.querySelector('#file-picker') as HTMLInputElement)?.click();
      });
    }
    const picker = this.querySelector('#file-picker') as HTMLInputElement;
    if (picker) {
      picker.addEventListener('change', async () => {
        if (picker.files?.length) await this.processAndAddFiles(picker.files);
        picker.value = '';
      });
    }
    const exportBtn = this.querySelector('#export-pdf') as HTMLButtonElement;
    if (exportBtn) exportBtn.addEventListener('click', () => this.handleExportClick());
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('pages') || changed.has('showSuccess')) {
      const tabletop = this.querySelector('#tabletop') as HTMLElement;
      if (tabletop && !this.showSuccess) this.renderTabletopContent(tabletop);
      const btn = this.querySelector('#export-pdf') as HTMLButtonElement;
      if (btn) btn.disabled = this.pages.length === 0;
    }
  }

  private dismissError(): void {
    this.errorMessage = null;
    this.requestUpdate();
  }

  override render() {
    const errorBanner =
      this.errorMessage ?
        html`
          <div
            class="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg px-4 py-3 bg-red-50 border border-red-200 rounded-lg shadow flex items-center gap-3"
            role="alert"
          >
            <p class="text-sm text-red-800 flex-1">${this.errorMessage}</p>
            <button
              type="button"
              class="text-red-600 hover:text-red-800 font-medium text-sm"
              @click=${this.dismissError}
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          </div>
        `
      : html``;

    if (this.showSuccess) {
      return html`
        ${errorBanner}
        <div class="flex h-screen bg-slate-100">
          <main class="flex-1 flex flex-col p-8 min-w-0 items-center justify-center">
            <p class="text-xl font-semibold text-slate-700">Download Started!</p>
            <button
              type="button"
              class="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 mt-4"
              @click=${this.startNewBatch}
            >
              Start New Batch
            </button>
          </main>
        </div>
      `;
    }
    return html`
      ${errorBanner}
      <div class="flex h-screen bg-slate-100">
        <main class="flex-1 flex flex-col p-8 min-w-0">
          <input type="file" id="file-picker" multiple accept="${FILE_INPUT_ACCEPT}" class="hidden" />
          <div
            id="tabletop"
            class="flex-1 min-h-[50vh] border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-white/80 hover:border-slate-400 transition-colors cursor-pointer overflow-hidden"
          ></div>
        </main>
        <aside class="w-80 bg-white border-l border-slate-200 p-4 flex flex-col gap-4">
          <h2 class="font-semibold text-slate-800">Actions</h2>
          <button
            id="export-pdf"
            class="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            ?disabled=${this.pages.length === 0}
          >
            Create 1 Combined PDF
          </button>
          <p class="text-sm text-slate-500 mt-auto">DocumentFlow Suite v1</p>
        </aside>
      </div>
      <export-modal
        ?open=${this.exportModalOpen}
        .defaultFilename=${getDefaultExportName()}
        @close=${this.onExportModalClose}
        @export-name=${(e: CustomEvent<string>) => this.onExportName(e)}
      ></export-modal>
    `;
  }
}
