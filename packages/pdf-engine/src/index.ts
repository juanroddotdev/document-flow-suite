export interface ProcessingPage {
  canvas: HTMLCanvasElement;
  order?: number;
}

export class DocumentProcessor {
  async normalizeToCanvas(_file: File): Promise<HTMLCanvasElement> {
    throw new Error('Not implemented');
  }

  async generateStapledPDF(_pages: ProcessingPage[]): Promise<Uint8Array> {
    throw new Error('Not implemented');
  }
}
