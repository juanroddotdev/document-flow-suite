/**
 * Stapled PDF export from page blobs (browser-only processing).
 */

import { DocumentProcessor, type ProcessingPage } from '@document-flow/pdf-engine';
import type { PageState } from '../app-state.js';
import { blobToCanvas } from '../utils/blob.js';

export async function buildProcessingPages(pages: PageState[]): Promise<ProcessingPage[]> {
  const out: ProcessingPage[] = [];
  for (let i = 0; i < pages.length; i++) {
    const canvas = await blobToCanvas(pages[i].blob);
    out.push({ canvas, order: i });
  }
  return out;
}

export async function downloadStapledPdf(
  processor: DocumentProcessor,
  processingPages: ProcessingPage[],
  filename: string
): Promise<void> {
  const bytes = await processor.generateStapledPDF(processingPages);
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
