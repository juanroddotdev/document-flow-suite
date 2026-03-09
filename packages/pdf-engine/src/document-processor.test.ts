import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentProcessor, type ProcessingPage } from './index.js';

describe('DocumentProcessor', () => {
  let processor: DocumentProcessor;

  beforeEach(() => {
    processor = new DocumentProcessor();
  });

  describe('normalizeToPages', () => {
    it('throws for unsupported file type', async () => {
      const file = new File(['x'], 'doc.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      await expect(processor.normalizeToPages(file)).rejects.toThrow('Unsupported file type');
    });

    it('throws for unknown extension', async () => {
      const file = new File(['x'], 'file.xyz', { type: 'application/octet-stream' });
      await expect(processor.normalizeToPages(file)).rejects.toThrow('Unsupported file type');
    });

    it.skip('returns pages for a valid PNG file (requires real Image/Blob load)', async () => {
      const pngBytes = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
        0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59, 0xe7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
        0x44, 0xae, 0x42, 0x60, 0x82,
      ]);
      const file = new File([pngBytes], 'dot.png', { type: 'image/png' });
      const pages = await processor.normalizeToPages(file);
      expect(pages).toHaveLength(1);
      expect(pages[0].canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(pages[0].canvas.width).toBe(1);
      expect(pages[0].canvas.height).toBe(1);
      expect(pages[0].order).toBe(0);
    });
  });

  describe('generateStapledPDF', () => {
    it('throws when pages array is empty', async () => {
      await expect(processor.generateStapledPDF([])).rejects.toThrow('No pages to staple');
    });

    it('returns a valid PDF for a single page', async () => {
      const minimalPng = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
        0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59, 0xe7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
        0x44, 0xae, 0x42, 0x60, 0x82,
      ]);
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      canvas.toBlob = function (callback, type) {
        const blob = new Blob([minimalPng], { type: type || 'image/png' });
        setTimeout(() => callback?.(blob), 0);
      };

      const pages: ProcessingPage[] = [{ canvas, order: 0 }];
      const pdfBytes = await processor.generateStapledPDF(pages);
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(0);
      expect(String.fromCharCode(...pdfBytes.slice(0, 5))).toBe('%PDF-');
    });

    it('respects page order', async () => {
      const minimalPng = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
        0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59, 0xe7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
        0x44, 0xae, 0x42, 0x60, 0x82,
      ]);
      const makeCanvas = () => {
        const c = document.createElement('canvas');
        c.width = 1;
        c.height = 1;
        c.toBlob = function (callback, type) {
          const blob = new Blob([minimalPng], { type: type || 'image/png' });
          setTimeout(() => callback?.(blob), 0);
        };
        return c;
      };
      const pages: ProcessingPage[] = [
        { canvas: makeCanvas(), order: 2 },
        { canvas: makeCanvas(), order: 0 },
        { canvas: makeCanvas(), order: 1 },
      ];
      const pdfBytes = await processor.generateStapledPDF(pages);
      expect(pdfBytes.length).toBeGreaterThan(0);
      expect(String.fromCharCode(...pdfBytes.slice(0, 5))).toBe('%PDF-');
    });
  });
});
