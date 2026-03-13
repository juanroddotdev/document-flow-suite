/**
 * Handles file processing to PageState. Swappable implementation (canvas now, worker+blobs in Step 5).
 */

import { DocumentProcessor } from '@document-flow/pdf-engine';
import type { PageState } from '../app-state.js';
import { canvasToDataUrl } from '../app-state.js';

export interface ProcessProgress {
  current: number;
  total: number;
}

export class ProcessingService {
  private processor = new DocumentProcessor();

  /**
   * Process files and return new pages to append to existing state.
   * @param files - files to process
   * @param getNextId - callback that returns the next page id
   * @param onProgress - optional progress callback (current file, total files)
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
      const pageResults = await this.processor.normalizeToPages(file);
      for (let j = 0; j < pageResults.length; j++) {
        const p = pageResults[j];
        const filename = pageResults.length > 1 ? `${file.name} (${j + 1})` : file.name;
        newPages.push({
          id: getNextId(),
          canvas: p.canvas,
          previewDataUrl: canvasToDataUrl(p.canvas),
          filename,
          status: 'ready',
        });
      }
    }
    return newPages;
  }
}
