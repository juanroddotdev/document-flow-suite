import { LitElement, html } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { DocumentProcessor, type ProcessingPage } from '@document-flow/pdf-engine';
import '@document-flow/ui-library';
import './export-modal.js';
import type { PageState } from '../app-state.js';
import { FILE_INPUT_ACCEPT } from '../app-state.js';
import { ProcessingService } from '../services/processing-service.js';
import { getErrorMessage } from '../utils/error.js';
import { getDefaultExportName } from '../utils/filename.js';
import {
  blobToPreviewDataUrl,
  blobToCanvas,
  rotateBlob90,
} from '../utils/blob.js';
import { ThumbnailDragController } from '../tabletop/tabletop-drag.js';
import {
  buildEmptyDropzoneHtml,
  buildSuccessHtml,
  buildThumbnailsHtml,
  attachTabletopEvents,
  getErrorBanner,
  createProgressBar,
  setupTabletopListeners,
} from '../tabletop/tabletop-render.js';

const processingService = new ProcessingService();
const processor = new DocumentProcessor();

@customElement('document-flow-app')
export class DocumentFlowApp extends LitElement {
  override createRenderRoot(): HTMLElement {
    return this;
  }

  @state() pages: PageState[] = [];
  @state() showSuccess = false;
  @state() errorMessage: string | null = null;

  @query('#tabletop') tabletopEl!: HTMLElement;
  @query('#file-picker') filePickerEl!: HTMLInputElement;
  @query('#export-pdf') exportBtnEl!: HTMLButtonElement;

  private nextId = 0;
  private dragController = new ThumbnailDragController();

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
    const progress = createProgressBar(tabletop);
    try {
      const newPages = await processingService.processFiles(
        files,
        () => `page-${this.nextId++}`,
        progress.update
      );
      this.errorMessage = null;
      this.pages = [...this.pages, ...newPages];
      this.renderTabletopContent();
    } catch (err) {
      console.error(err);
      this.errorMessage = getErrorMessage(err);
      this.renderTabletopContent();
    } finally {
      progress.remove();
    }
  }

  private dismissError(): void {
    this.errorMessage = null;
    this.renderTabletopContent();
  }

  private getTabletopHandlers() {
    return {
      dismissError: () => this.dismissError(),
      addFiles: () => this.filePickerEl?.click(),
      startNewBatch: () => this.startNewBatch(),
      onRotate: (e: Event) => this.handleRotate(e),
      onDelete: (e: Event) => this.handleDelete(e),
      onDragStart: (e: DragEvent, fc: HTMLElement) => this.handleDragStart(e, fc),
      onDragOver: (e: DragEvent, fc: HTMLElement) => this.handleDragOver(e, fc),
      onDrop: (e: DragEvent, fc: HTMLElement) => this.handleDrop(e, fc),
    };
  }

  private renderTabletopContent(): void {
    const container = this.tabletopEl;
    if (!container) return;
    const errorBanner = this.errorMessage ? getErrorBanner(this.errorMessage) : '';
    const handlers = this.getTabletopHandlers();

    if (this.showSuccess) {
      container.innerHTML = buildSuccessHtml(errorBanner);
      attachTabletopEvents(container, this.pages, handlers);
      return;
    }

    if (this.pages.length === 0) {
      container.innerHTML = buildEmptyDropzoneHtml(errorBanner);
      attachTabletopEvents(container, this.pages, handlers);
      return;
    }

    container.innerHTML = buildThumbnailsHtml(this.pages, errorBanner);
    attachTabletopEvents(container, this.pages, handlers);
  }

  private handleDragStart(e: DragEvent, flexContainer: HTMLElement): void {
    this.dragController.handleDragStart(
      e,
      flexContainer,
      this.pages,
      () => this.renderTabletopContent(),
      (fromIndex, toIndex) => {
        const next = [...this.pages];
        const [removed] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, removed);
        this.pages = next;
        this.renderTabletopContent();
      }
    );
  }

  private handleDragOver(e: DragEvent, flexContainer: HTMLElement): void {
    this.dragController.handleDragOver(e, flexContainer);
  }

  private handleDrop(e: DragEvent, flexContainer: HTMLElement): void {
    this.dragController.handleDrop(
      e,
      flexContainer,
      this.pages,
      (fromIndex, toIndex) => {
        const next = [...this.pages];
        const [removed] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, removed);
        this.pages = next;
        this.renderTabletopContent();
      }
    );
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
      this.errorMessage = getErrorMessage(err);
      this.renderTabletopContent();
    } finally {
      if (this.exportBtnEl) this.exportBtnEl.disabled = false;
    }
  }

  private startNewBatch(): void {
    this.pages = [];
    this.showSuccess = false;
    this.errorMessage = null;
    this.renderTabletopContent();
    if (this.exportBtnEl) this.exportBtnEl.disabled = true;
  }

  override firstUpdated(): void {
    const tabletop = this.tabletopEl;
    if (!tabletop) return;

    this.renderTabletopContent();
    setupTabletopListeners(tabletop, () => this.pages.length > 0, {
      onFileDrop: (files) => this.processAndAddFiles(files),
      onEmptyClick: () => this.filePickerEl?.click(),
    });
    this.filePickerEl?.addEventListener('change', async () => {
      if (this.filePickerEl?.files?.length) {
        await this.processAndAddFiles(this.filePickerEl.files);
        this.filePickerEl.value = '';
      }
    });
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('pages') || changed.has('showSuccess') || changed.has('errorMessage')) {
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
          ${this.pages.length > 0
            ? html`<button
                type="button"
                class="px-4 py-2 border-2 border-dashed border-slate-400 text-slate-600 rounded-lg hover:border-slate-500 hover:bg-slate-50"
                @click=${() => this.filePickerEl?.click()}
              >
                + Add files
              </button>`
            : ''}
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
