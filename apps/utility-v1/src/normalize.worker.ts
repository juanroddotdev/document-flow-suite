/**
 * Web Worker: normalizes files (TIFF, PDF, raster) off the main thread.
 * HEIC is handled on main thread (heic2any requires DOM).
 */

import * as Comlink from 'comlink';
import { normalizeFileInWorker } from '@document-flow/pdf-engine/worker';

const api = {
  normalizeFile: normalizeFileInWorker,
};

Comlink.expose(api);
