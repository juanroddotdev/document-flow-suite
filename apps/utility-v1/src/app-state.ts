/**
 * Shared types and constants for the document flow app.
 */

export interface PageState {
  id: string;
  blob: Blob;
  previewDataUrl?: string;
  filename: string;
  status: 'processing' | 'ready';
  rotation: 0 | 90 | 180 | 270;
}

export const VIRTUAL_ITEM_SIZE = 160;
export const VIRTUAL_GAP = 16;
export const VIRTUAL_ROW_HEIGHT = VIRTUAL_ITEM_SIZE + VIRTUAL_GAP;

export const FILE_INPUT_ACCEPT =
  '.heic,.tif,.tiff,.png,.jpg,.jpeg,.pdf,image/heic,image/tiff,image/png,image/jpeg,application/pdf';
