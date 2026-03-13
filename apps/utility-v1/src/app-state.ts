/**
 * Shared types and pure helpers for the document flow app.
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

export function blobToPreviewDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 160;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Failed to load image for preview'));
    img.src = URL.createObjectURL(blob);
  });
}

export function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(blob);
  });
}

export async function rotateBlob90(blob: Blob): Promise<Blob> {
  const canvas = await blobToCanvas(blob);
  const out = document.createElement('canvas');
  out.width = canvas.height;
  out.height = canvas.width;
  const ctx = out.getContext('2d');
  if (!ctx) return blob;
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  return new Promise((resolve, reject) => {
    out.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png', 0.9);
  });
}
