import type { ExportModal } from './export-modal.js';

export function queryExportModal(host: HTMLElement | Document | ShadowRoot): ExportModal | null {
  return host.querySelector('#export-modal') as ExportModal | null;
}
