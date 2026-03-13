/**
 * Handles file processing to PageState. Uses worker for TIFF/PDF/raster, main thread for HEIC.
 */

import { DocumentProcessor, isHeic } from '@document-flow/pdf-engine';
import type { PageState } from '../app-state.js';
import { blobToPreviewDataUrl } from '../app-state.js';

type NormalizeWorkerApi = { normalizeFile: (file: File) => Promise<Blob[]> };

export interface ProcessProgress {
  current: number;
  total: number;
}

export class ProcessingService {
  private processor = new DocumentProcessor();
  private workerApi: NormalizeWorkerApi | null = null;

  private async getWorkerApi(): Promise<NormalizeWorkerApi> {
    if (this.workerApi) return this.workerApi;
    const worker = new Worker(new URL('../normalize.worker.ts', import.meta.url), { type: 'module' });
    const Comlink = await import('comlink');
    this.workerApi = Comlink.wrap(worker) as NormalizeWorkerApi;
    return this.workerApi;
  }

  private async getBlobsForFile(file: File): Promise<Blob[]> {
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

  /**
   * Process files and return new pages to append to existing state.
   */
  async processFiles(
    files: FileList,
    getNextId: () => string,
    onProgress?: (progress: ProcessProgress) => void
  ): Promise<PageState[]> {
    const newPages: PageState[] = [];
    for (let i = 0; i < files.length; i++) {
      onProgress?.({ current: i + 1, total: files.length });
      const file = files[i];
      const blobs = await this.getBlobsForFile(file);
      for (let j = 0; j < blobs.length; j++) {
        const blob = blobs[j];
        const filename = blobs.length > 1 ? `${file.name} (${j + 1})` : file.name;
        const previewDataUrl = await blobToPreviewDataUrl(blob);
        newPages.push({
          id: getNextId(),
          blob,
          previewDataUrl,
          filename,
          status: 'ready',
          rotation: 0,
        });
      }
    }
    return newPages;
  }
}
