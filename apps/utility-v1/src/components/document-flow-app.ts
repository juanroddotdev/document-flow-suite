import { LitElement, html } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { DocumentProcessor, type ProcessingPage } from '@document-flow/pdf-engine';
import '@document-flow/ui-library';
import './export-modal.js';
import type { PageState } from '../app-state.js';
import {
  FILE_INPUT_ACCEPT,
  getDefaultExportName,
  blobToPreviewDataUrl,
  blobToCanvas,
  rotateBlob90,
} from '../app-state.js';
import { ProcessingService } from '../services/processing-service.js';

const processingService = new ProcessingService();
const processor = new DocumentProcessor();

@customElement('document-flow-app')
export class DocumentFlowApp extends LitElement {
  override createRenderRoot(): HTMLElement {
    return this;
  }

  @state() pages: PageState[] = [];
  @state() showSuccess = false;

  @query('#tabletop') tabletopEl!: HTMLElement;
  @query('#file-picker') filePickerEl!: HTMLInputElement;
  @query('#export-pdf') exportBtnEl!: HTMLButtonElement;

  private nextId = 0;
  private dragPlaceholder: HTMLElement | null = null;
  private lastDropIndex = -1;

  private showExportModal(): Promise<string | null> {
    const modal = this.querySelector('#export-modal') as HTMLElement & {
      defaultFilename: string;
      open: boolean;
    };
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
    try {
      const newPages = await processingService.processFiles(
        files,
        () => `page-${this.nextId++}`,
        (p) => {
          if (progressText) progressText.textContent = `Processing file ${p.current} of ${p.total}`;
          if (progressFill) progressFill.style.width = `${(p.current / p.total) * 100}%`;
        }
      );
      this.pages = [...this.pages, ...newPages];
      this.renderTabletopContent();
    } catch (err) {
      console.error(err);
      if (progressText) progressText.textContent = `Error: ${err instanceof Error ? err.message : 'Failed to process'}`;
    } finally {
      progressWrap.remove();
    }
  }

  private renderTabletopContent(): void {
    const container = this.tabletopEl;
    if (!container) return;
    if (this.showSuccess) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center gap-4 text-center p-8">
          <p class="text-xl font-semibold text-slate-700">Download Started!</p>
          <button type="button" id="start-new-batch" class="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
            Start New Batch
          </button>
        </div>
      `;
      this.querySelector('#start-new-batch')?.addEventListener('click', () => this.startNewBatch());
      return;
    }
    if (this.pages.length === 0) {
      container.innerHTML = `
        <div class="text-center text-slate-500 empty-dropzone-content">
          <p class="text-xl font-semibold text-slate-600">Drop Files Anywhere</p>
          <p class="text-sm mt-2">or click to browse</p>
          <p class="text-xs mt-3 text-slate-400">HEIC, TIFF, PNG, JPG, PDF</p>
        </div>
      `;
      return;
    }
    const thumbnailsHtml = this.pages
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
      const p = this.pages[i];
      if (p) {
        el.setAttribute('preview', p.previewDataUrl ?? '');
        el.setAttribute('filename', p.filename);
        el.setAttribute('page-index', String(i + 1));
      }
    });

    container.querySelectorAll('[draggable="true"]').forEach((el) => {
      el.addEventListener('dragstart', (e: Event) =>
        this.handleDragStart(e as DragEvent, flexContainer)
      );
      el.addEventListener('dragover', (e: Event) =>
        this.handleDragOver(e as DragEvent, flexContainer)
      );
      el.addEventListener('drop', (e: Event) =>
        this.handleDrop(e as DragEvent, flexContainer)
      );
    });
    container.querySelectorAll('file-thumbnail').forEach((el) => {
      el.addEventListener('rotate', (e: Event) => this.handleRotate(e));
      el.addEventListener('delete', (e: Event) => this.handleDelete(e));
    });
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
      'flex-shrink-0 border-2 border-dashed border-slate-400 rounded-lg bg-slate-100/80 rounded-lg';
    this.dragPlaceholder.style.width = `${widthPx}px`;
    this.dragPlaceholder.style.height = `${heightPx}px`;
    this.dragPlaceholder.style.minWidth = `${widthPx}px`;
    this.dragPlaceholder.setAttribute('aria-hidden', 'true');
    return this.dragPlaceholder;
  }

  private handleDragStart(e: DragEvent, flexContainer: HTMLElement): void {
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
        this.renderTabletopContent();
      },
      { once: true, capture: true }
    );

    ph.addEventListener('dragover', (ev: Event) => this.handleDragOver(ev as DragEvent, flexContainer));
    ph.addEventListener('drop', (ev: Event) => this.handleDrop(ev as DragEvent, flexContainer));
  }

  private handleDragOver(e: DragEvent, flexContainer: HTMLElement): void {
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

  private handleDrop(e: DragEvent, flexContainer: HTMLElement): void {
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
    this.renderTabletopContent();
  }

  private async handleRotate(e: Event): Promise<void> {
    const wrapper = (e.target as HTMLElement).closest('[data-page-id]') as HTMLElement;
    const id = wrapper?.getAttribute('data-page-id');
    if (!id) return;
    const page = this.pages.find((p) => p.id === id);
    if (!page) return;
    page.blob = await rotateBlob90(page.blob);
    page.previewDataUrl = await blobToPreviewDataUrl(page.blob);
    page.rotation = ((page.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    this.pages = [...this.pages];
    this.renderTabletopContent();
  }

  private handleDelete(e: Event): void {
    const id = (e.target as HTMLElement).closest('[data-page-id]')?.getAttribute('data-page-id');
    if (!id) return;
    this.pages = this.pages.filter((p) => p.id !== id);
    this.renderTabletopContent();
  }

  private async handleExport(): Promise<void> {
    if (this.pages.length === 0) return;
    if (this.exportBtnEl) this.exportBtnEl.disabled = true;
    const filename = await this.showExportModal();
    if (!filename) {
      if (this.exportBtnEl) this.exportBtnEl.disabled = false;
      return;
    }
    try {
      const pages: ProcessingPage[] = [];
      for (let i = 0; i < this.pages.length; i++) {
        const canvas = await blobToCanvas(this.pages[i].blob);
        pages.push({ canvas, order: i });
      }
      const bytes = await processor.generateStapledPDF(pages);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      this.showSuccess = true;
    } catch (err) {
      console.error(err);
    } finally {
      if (this.exportBtnEl) this.exportBtnEl.disabled = false;
    }
  }

  private startNewBatch(): void {
    this.pages = [];
    this.showSuccess = false;
    this.renderTabletopContent();
    if (this.exportBtnEl) this.exportBtnEl.disabled = true;
  }

  override firstUpdated(): void {
    const tabletop = this.tabletopEl;
    if (!tabletop) return;

    this.renderTabletopContent();

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
      await this.processAndAddFiles(files);
    });
    tabletop.addEventListener('click', (e) => {
      if (this.pages.length !== 0) return;
      if (!tabletop.contains(e.target as Node)) return;
      this.filePickerEl?.click();
    });
    this.filePickerEl?.addEventListener('change', async () => {
      if (this.filePickerEl?.files?.length) {
        await this.processAndAddFiles(this.filePickerEl.files);
        this.filePickerEl.value = '';
      }
    });
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('pages') || changed.has('showSuccess')) {
      if (this.tabletopEl) this.renderTabletopContent();
      if (this.exportBtnEl) this.exportBtnEl.disabled = this.pages.length === 0;
    }
  }

  override render() {
    return html`
      <div class="flex h-screen bg-slate-100">
        <main class="flex-1 flex flex-col p-8 min-w-0">
          <input
            type="file"
            id="file-picker"
            multiple
            accept="${FILE_INPUT_ACCEPT}"
            class="hidden"
          />
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
            @click=${this.handleExport}
          >
            Create 1 Combined PDF
          </button>
          <p class="text-sm text-slate-500 mt-auto">DocumentFlow Suite v1</p>
        </aside>
      </div>
      <export-modal id="export-modal"></export-modal>
    `;
  }
}
