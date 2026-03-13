/**
 * Shared types and pure helpers for the document flow app.
 */

export interface PageState {
  id: string;
  canvas: HTMLCanvasElement;
  previewDataUrl: string;
  filename: string;
  status: 'processing' | 'ready';
}

export const VIRTUAL_ITEM_SIZE = 160;
export const VIRTUAL_GAP = 16;
export const VIRTUAL_ROW_HEIGHT = VIRTUAL_ITEM_SIZE + VIRTUAL_GAP;

export const FILE_INPUT_ACCEPT =
  '.heic,.tif,.tiff,.png,.jpg,.jpeg,.pdf,image/heic,image/tiff,image/png,image/jpeg,application/pdf';

const INVALID_FILENAME_CHARS = /[/\\:*?"<>|]/g;

export function sanitizeFilename(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  const sanitized = trimmed.replace(INVALID_FILENAME_CHARS, '_');
  return sanitized.endsWith('.pdf') ? sanitized : `${sanitized}.pdf`;
}

export function getDefaultExportName(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `Standardized_Batch_${date}.pdf`;
}
