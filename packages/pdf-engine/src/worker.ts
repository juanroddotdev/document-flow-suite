/**
 * Worker-safe normalizer: returns Blob[] per file.
 * Handles TIFF, PDF, and raster only. HEIC must be run on main thread (heic2any needs DOM).
 */

import * as pdfjsLib from 'pdfjs-dist';
import UTIF from 'utif';
import { isPdf, isRasterImage, isTiff } from './file-types.js';

async function normalizeTiff(file: File): Promise<Blob[]> {
  const buffer = await file.arrayBuffer();
  const ifds = UTIF.decode(buffer);
  const blobs: Blob[] = [];
  for (let i = 0; i < ifds.length; i++) {
    UTIF.decodeImage(buffer, ifds[i]);
    const rgba = UTIF.toRGBA8(ifds[i]);
    const { width, height } = ifds[i];
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(rgba);
    ctx.putImageData(imageData, 0, 0);
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    blobs.push(blob);
  }
  if (blobs.length === 0) {
    const empty = new OffscreenCanvas(1, 1);
    const b = await empty.convertToBlob({ type: 'image/png' });
    blobs.push(b);
  }
  return blobs;
}

class OffscreenCanvasFactory {
  create(width: number, height: number) {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');
    return { canvas, context };
  }
  reset(
    canvasAndContext: { canvas: OffscreenCanvas; context: CanvasRenderingContext2D },
    width: number,
    height: number
  ) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }
  destroy(
    canvasAndContext: { canvas: OffscreenCanvas; context: CanvasRenderingContext2D }
  ) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
  }
}

async function normalizePdf(file: File): Promise<Blob[]> {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  const data = new Uint8Array(await file.arrayBuffer());

  const createSvgStub = (): Record<string, unknown> => ({
    setAttribute: () => {},
    setAttributeNS: () => {},
    getAttribute: () => null,
    appendChild: (child: unknown) => child,
    append: () => {},
    removeChild: () => null,
    style: {},
    childNodes: [],
  });

  const bodyStub = createSvgStub();
  const documentElementStub = createSvgStub();

  const ownerDocument = {
    body: bodyStub,
    documentElement: documentElementStub,
    createElement: (name: string) => {
      if (name === 'canvas') return new OffscreenCanvas(1, 1);
      return createSvgStub();
    },
    createElementNS: (_ns: string, qualifiedName: string) => {
      const localName = qualifiedName.includes(':') ? qualifiedName.split(':')[1] : qualifiedName;
      if (localName === 'canvas') return new OffscreenCanvas(1, 1);
      return createSvgStub();
    },
  } as unknown as Document;

  const loadingTask = pdfjsLib.getDocument({
    data,
    ownerDocument,
    canvasFactory: OffscreenCanvasFactory,
  } as Parameters<typeof pdfjsLib.getDocument>[0]);
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const blobs: Blob[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 2;
    const viewport = page.getViewport({ scale });
    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    await page.render({
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;
    page.cleanup();
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    blobs.push(blob);
  }
  return blobs;
}

function normalizeRaster(file: File): Promise<Blob[]> {
  return Promise.resolve([file]);
}

/**
 * Normalize a file to an array of image Blobs (one per page).
 * Only supports TIFF, PDF, and raster. For HEIC, use main-thread DocumentProcessor.
 */
export async function normalizeFileInWorker(file: File): Promise<Blob[]> {
  try {
    if (isTiff(file)) return await normalizeTiff(file);
    if (isPdf(file)) return await normalizePdf(file);
    if (isRasterImage(file)) return normalizeRaster(file);
    throw new Error(`UNSUPPORTED_FILE_TYPE: ${file.type} (${file.name}). Use main thread for HEIC.`);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const name = e instanceof Error ? e.name : '';
    if (message.startsWith('UNSUPPORTED_FILE_TYPE:')) throw e;
    if (/password|PasswordException/i.test(message) || /PasswordException/i.test(name)) {
      throw new Error('NORMALIZATION_FAILED: This PDF is password-protected. Remove the password and try again.');
    }
    throw new Error(`NORMALIZATION_FAILED: ${message}`);
  }
}
