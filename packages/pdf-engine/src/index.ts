import imageCompression from 'browser-image-compression';

export type { DocumentFlowError } from './errors.js';
export { ErrorCode, isDocumentFlowError } from './errors.js';
import heic2any from 'heic2any';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import UTIF from 'utif';

const TARGET_DPI = 150;
const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5MB

export interface ProcessingPage {
  canvas: HTMLCanvasElement;
  order?: number;
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = createCanvas(img.naturalWidth, img.naturalHeight);
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

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type.includes('heic') ||
    type.includes('heif')
  );
}

function isTiff(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return name.endsWith('.tiff') || name.endsWith('.tif') || type.includes('tiff');
}

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function isRasterImage(file: File): boolean {
  const type = file.type.toLowerCase();
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'].includes(
    type
  );
}

async function normalizeHeic(file: File): Promise<ProcessingPage[]> {
  const result = await heic2any({
    blob: file,
    toType: 'image/png',
    quality: 0.9,
  });
  const blobs = Array.isArray(result) ? result : [result];
  const pages: ProcessingPage[] = [];
  for (let i = 0; i < blobs.length; i++) {
    const canvas = await blobToCanvas(blobs[i] as Blob);
    pages.push({ canvas, order: i });
  }
  return pages;
}

async function normalizeRaster(file: File): Promise<ProcessingPage[]> {
  const canvas = await blobToCanvas(file);
  return [{ canvas, order: 0 }];
}

async function normalizeTiff(file: File): Promise<ProcessingPage[]> {
  const buffer = await file.arrayBuffer();
  const ifds = UTIF.decode(buffer);
  const pages: ProcessingPage[] = [];
  for (let i = 0; i < ifds.length; i++) {
    UTIF.decodeImage(buffer, ifds[i]);
    const rgba = UTIF.toRGBA8(ifds[i]);
    const { width, height } = ifds[i];
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(rgba);
    ctx.putImageData(imageData, 0, 0);
    pages.push({ canvas, order: i });
  }
  return pages.length > 0 ? pages : [{ canvas: createCanvas(1, 1), order: 0 }];
}

async function normalizePdf(file: File): Promise<ProcessingPage[]> {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pages: ProcessingPage[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 2; // 2x for reasonable quality
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;
    page.cleanup();
    pages.push({ canvas, order: i - 1 });
  }

  return pages;
}

async function downscaleForOptimization(
  canvas: HTMLCanvasElement,
  maxDimension: number
): Promise<HTMLCanvasElement> {
  const w = canvas.width;
  const h = canvas.height;
  if (w <= maxDimension && h <= maxDimension) return canvas;
  const scale = Math.min(maxDimension / w, maxDimension / h);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.85);
  });
  const compressed = await imageCompression(blob as unknown as File, {
    maxWidthOrHeight: Math.round(Math.max(w, h) * scale),
    useWebWorker: false,
  });
  return blobToCanvas(compressed as unknown as Blob);
}

export class DocumentProcessor {
  async normalizeToPages(file: File): Promise<ProcessingPage[]> {
    if (isHeic(file)) return normalizeHeic(file);
    if (isTiff(file)) return normalizeTiff(file);
    if (isPdf(file)) return normalizePdf(file);
    if (isRasterImage(file)) return normalizeRaster(file);
    throw new Error(`Unsupported file type: ${file.type} (${file.name})`);
  }

  async generateStapledPDF(pages: ProcessingPage[]): Promise<Uint8Array> {
    if (pages.length === 0) throw new Error('No pages to staple');

    const sorted = [...pages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const addPagesToDoc = async (
      doc: PDFDocument,
      sourcePages: ProcessingPage[],
      useJpeg: boolean,
      maxDim?: number
    ) => {
      for (const page of sourcePages) {
        let canvas = page.canvas;
        if (maxDim) {
          canvas = await downscaleForOptimization(canvas, maxDim);
        }
        const w = canvas.width;
        const h = canvas.height;
        const widthPt = (w * 72) / TARGET_DPI;
        const heightPt = (h * 72) / TARGET_DPI;
        doc.addPage([widthPt, heightPt]);

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
            useJpeg ? 'image/jpeg' : 'image/png',
            useJpeg ? 0.8 : 1
          );
        });
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const img = useJpeg ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
        const pdfPage = doc.getPage(doc.getPageCount() - 1);
        pdfPage.drawImage(img, { x: 0, y: 0, width: widthPt, height: heightPt });
      }
    };

    const doc = await PDFDocument.create();
    await addPagesToDoc(doc, sorted, false);
    let result = await doc.save();

    if (result.byteLength > MAX_PDF_BYTES) {
      const doc2 = await PDFDocument.create();
      await addPagesToDoc(doc2, sorted, true, 2000);
      result = await doc2.save();
    }

    return result;
  }
}
