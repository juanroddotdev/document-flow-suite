import { LitElement, html } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { DocumentProcessor } from '@document-flow/pdf-engine';
import '@document-flow/ui-library';
import './export-modal.js';
import './toast-container.js';
import './document-flow-sidebar.js';
import './preview-lightbox.js';
import type { IslandState } from '../app-state.js';
import { FILE_INPUT_ACCEPT, flattenPagesInIslandOrder, findPageLocation } from '../app-state.js';
import { ProcessingService } from '../services/processing-service.js';
import { buildProcessingPagesFromIslands, downloadStapledPdf } from '../services/export-stapled-pdf.js';
import { getErrorMessage } from '../utils/error.js';
import { getDefaultExportName } from '../utils/filename.js';
import { validateFiles } from '../utils/preflight.js';
import { showToast } from '../utils/toast.js';
import { blobToPreviewDataUrl, rotateBlob90 } from '../utils/blob.js';
import { ThumbnailDragController } from '../tabletop/tabletop-drag.js';
import {
  buildEmptyDropzoneHtml,
  buildSuccessHtml,
  buildThumbnailsHtml,
  attachTabletopEvents,
  getErrorBanner,
  createProgressBar,
  setupTabletopListeners,
  type CardStyle,
  type PreviewOpenDetail,
} from '../tabletop/tabletop-render.js';
import { queryExportModal } from './export-modal-helpers.js';

const processingService = new ProcessingService();
const processor = new DocumentProcessor();

@customElement('document-flow-app')
export class DocumentFlowApp extends LitElement {
  override createRenderRoot(): HTMLElement {
    return this;
  }

  @state() islands: IslandState[] = [];
  @state() showSuccess = false;
  @state() errorMessage: string | null = null;
  @state() cardStyle: CardStyle = 'glass';
  @state() private previewLightbox: PreviewOpenDetail | null = null;

  @query('#tabletop') tabletopEl!: HTMLElement;
  @query('#file-picker') filePickerEl!: HTMLInputElement;

  private nextIslandId = 0;
  private nextPageId = 0;
  private dragController = new ThumbnailDragController();

  private getNextIslandId(): string {
    return `island-${this.nextIslandId++}`;
  }

  private getNextPageId(): string {
    return `page-${this.nextPageId++}`;
  }

  private get totalPageCount(): number {
    return flattenPagesInIslandOrder(this.islands).length;
  }

  private showExportModal(): Promise<string | null> {
    const modal = queryExportModal(this);
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

  /** Reorder pages within one island after drag-drop. */
  private applyReorderInIsland(islandId: string, fromIndex: number, toIndex: number): void {
    this.islands = this.islands.map((island) => {
      if (island.id !== islandId) return island;
      const pages = [...island.pages];
      const [removed] = pages.splice(fromIndex, 1);
      pages.splice(toIndex, 0, removed);
      return { ...island, pages };
    });
    requestAnimationFrame(() => {
      const flex = this.tabletopEl?.querySelector(
        `.thumbnails-flex[data-island-id="${islandId}"]`
      ) as HTMLElement | undefined;
      const item = flex?.children[toIndex] as HTMLElement | undefined;
      if (item?.classList) {
        item.classList.add('drop-bounce');
        const remove = () => {
          item.classList.remove('drop-bounce');
          item.removeEventListener('animationend', remove);
        };
        item.addEventListener('animationend', remove);
      }
    });
  }

  private async processAndAddFiles(files: FileList): Promise<void> {
    const tabletop = this.tabletopEl;
    if (!tabletop) return;

    const { valid, errors } = validateFiles(files);
    if (errors.length > 0) {
      const msg = errors.map((e) => `${e.fileName}: ${e.reason}`).join(' ');
      this.errorMessage = msg;
      showToast('Some files could not be added', 'error', {
        details: msg,
        duration: 10000,
      });
      return;
    }
    if (valid.length === 0) return;

    const validFileList = (() => {
      const dt = new DataTransfer();
      valid.forEach((f) => dt.items.add(f));
      return dt.files;
    })();

    const progress = createProgressBar(tabletop);
    try {
      const newIslands = await processingService.processFilesToIslands(
        validFileList,
        () => this.getNextIslandId(),
        () => this.getNextPageId(),
        progress.update
      );
      this.errorMessage = null;
      this.islands = [...this.islands, ...newIslands];
      const addedPages = newIslands.reduce((n, i) => n + i.pages.length, 0);
      const fileCount = validFileList.length;
      showToast(
        `Added ${addedPages} page${addedPages !== 1 ? 's' : ''} in ${newIslands.length} package${newIslands.length !== 1 ? 's' : ''} from ${fileCount} file${fileCount !== 1 ? 's' : ''}`,
        'success',
        {
          details: flattenPagesInIslandOrder(newIslands)
            .map((p) => p.filename)
            .join(', '),
        }
      );
    } catch (err) {
      console.error(err);
      const msg = getErrorMessage(err);
      this.errorMessage = msg;
      showToast('Processing failed', 'error', {
        details: msg,
        duration: 10000,
      });
    } finally {
      progress.remove();
    }
  }

  private dismissError(): void {
    this.errorMessage = null;
  }

  private getTabletopHandlers() {
    return {
      dismissError: () => this.dismissError(),
      addFiles: () => this.filePickerEl?.click(),
      startNewBatch: () => this.startNewBatch(),
      onRotate: (e: Event) => this.handleRotate(e),
      onDelete: (e: Event) => this.handleDelete(e),
      onPreviewOpen: (e: CustomEvent<PreviewOpenDetail>) => this.handlePreviewOpen(e),
      onDragStart: (e: DragEvent, fc: HTMLElement, islandId: string) => this.handleDragStart(e, fc, islandId),
      onDragOver: (e: DragEvent, fc: HTMLElement, islandId: string) => this.handleDragOver(e, fc, islandId),
      onDrop: (e: DragEvent, fc: HTMLElement, islandId: string) => this.handleDrop(e, fc, islandId),
    };
  }

  private renderTabletopContent(): void {
    const container = this.tabletopEl;
    if (!container) return;
    const errorBanner = this.errorMessage ? getErrorBanner(this.errorMessage) : '';
    const handlers = this.getTabletopHandlers();

    if (this.showSuccess) {
      container.innerHTML = buildSuccessHtml(errorBanner);
      attachTabletopEvents(container, [], handlers);
      return;
    }

    if (this.islands.length === 0) {
      container.innerHTML = buildEmptyDropzoneHtml(errorBanner);
      attachTabletopEvents(container, [], handlers);
      return;
    }

    container.innerHTML = buildThumbnailsHtml(this.islands, errorBanner, this.cardStyle);
    attachTabletopEvents(container, this.islands, handlers);
  }

  private handleDragStart(e: DragEvent, flexContainer: HTMLElement, islandId: string): void {
    const island = this.islands.find((i) => i.id === islandId);
    if (!island) return;
    this.dragController.handleDragStart(
      e,
      flexContainer,
      island.pages,
      () => this.renderTabletopContent(),
      (fromIndex, toIndex) => this.applyReorderInIsland(islandId, fromIndex, toIndex)
    );
  }

  private handleDragOver(e: DragEvent, flexContainer: HTMLElement, _islandId: string): void {
    this.dragController.handleDragOver(e, flexContainer);
  }

  private handleDrop(e: DragEvent, flexContainer: HTMLElement, islandId: string): void {
    const island = this.islands.find((i) => i.id === islandId);
    if (!island) return;
    this.dragController.handleDrop(e, flexContainer, island.pages, (fromIndex, toIndex) =>
      this.applyReorderInIsland(islandId, fromIndex, toIndex)
    );
  }

  private async handleRotate(e: Event): Promise<void> {
    const wrapper = (e.target as HTMLElement).closest('[data-page-id]') as HTMLElement;
    const id = wrapper?.getAttribute('data-page-id');
    if (!id) return;
    const loc = findPageLocation(this.islands, id);
    if (!loc) return;
    const page = this.islands[loc.islandIndex].pages[loc.pageIndex];
    page.blob = await rotateBlob90(page.blob);
    page.previewDataUrl = await blobToPreviewDataUrl(page.blob);
    page.rotation = ((page.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    this.islands = [...this.islands];
  }

  private handleDelete(e: Event): void {
    const id = (e.target as HTMLElement).closest('[data-page-id]')?.getAttribute('data-page-id');
    if (!id) return;
    const loc = findPageLocation(this.islands, id);
    if (!loc) return;
    this.islands = this.islands
      .map((island, idx) => {
        if (idx !== loc.islandIndex) return island;
        const pages = island.pages.filter((p) => p.id !== id);
        return { ...island, pages };
      })
      .filter((island) => island.pages.length > 0);
  }

  private handlePreviewOpen(e: CustomEvent<PreviewOpenDetail>): void {
    this.previewLightbox = e.detail;
  }

  private async handleExport(): Promise<void> {
    if (this.totalPageCount === 0) return;
    const filename = await this.showExportModal();
    if (!filename) return;
    try {
      const processingPages = await buildProcessingPagesFromIslands(this.islands);
      await downloadStapledPdf(processor, processingPages, filename);
      this.showSuccess = true;
      showToast(`PDF downloaded: ${filename}`, 'success', {
        details: `${this.totalPageCount} page${this.totalPageCount !== 1 ? 's' : ''} combined`,
      });
    } catch (err) {
      console.error(err);
      const msg = getErrorMessage(err);
      this.errorMessage = msg;
      showToast('Export failed', 'error', {
        details: msg,
        duration: 10000,
      });
    }
  }

  private startNewBatch(): void {
    this.islands = [];
    this.showSuccess = false;
    this.errorMessage = null;
  }

  private onCardStyleChange(e: CustomEvent<CardStyle>): void {
    this.cardStyle = e.detail;
  }

  override firstUpdated(): void {
    const tabletop = this.tabletopEl;
    if (!tabletop) return;

    this.renderTabletopContent();
    setupTabletopListeners(tabletop, () => this.totalPageCount > 0, {
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
    if (
      changed.has('islands') ||
      changed.has('showSuccess') ||
      changed.has('errorMessage') ||
      changed.has('cardStyle')
    ) {
      if (this.tabletopEl) this.renderTabletopContent();
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
        <document-flow-sidebar
          .pageCount=${this.totalPageCount}
          .cardStyle=${this.cardStyle}
          @card-style-change=${this.onCardStyleChange}
          @add-files=${() => this.filePickerEl?.click()}
          @export-requested=${this.handleExport}
        ></document-flow-sidebar>
      </div>
      <export-modal id="export-modal"></export-modal>
      <preview-lightbox
        .open=${this.previewLightbox !== null}
        .src=${this.previewLightbox?.preview ?? ''}
        .filename=${this.previewLightbox?.filename ?? ''}
        @close=${() => {
          this.previewLightbox = null;
        }}
      ></preview-lightbox>
      <toast-container></toast-container>
    `;
  }
}
