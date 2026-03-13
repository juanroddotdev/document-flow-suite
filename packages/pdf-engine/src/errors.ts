/**
 * Typed errors for document processing. No PII/document content in messages.
 */

export const ErrorCode = {
  UnsupportedFileType: 'UNSUPPORTED_FILE_TYPE',
  NormalizationFailed: 'NORMALIZATION_FAILED',
  ExportFailed: 'EXPORT_FAILED',
  WorkerUnavailable: 'WORKER_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export class DocumentFlowError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = 'DocumentFlowError';
    Object.setPrototypeOf(this, DocumentFlowError.prototype);
  }
}

export function unsupportedFileType(fileName: string, mimeType: string): DocumentFlowError {
  return new DocumentFlowError(
    ErrorCode.UnsupportedFileType,
    `Unsupported file type: ${mimeType} (${fileName})`
  );
}

export function normalizationFailed(fileName: string, reason: string, cause?: unknown): DocumentFlowError {
  return new DocumentFlowError(
    ErrorCode.NormalizationFailed,
    `Could not process "${fileName}": ${reason}`,
    cause
  );
}

export function exportFailed(reason: string, cause?: unknown): DocumentFlowError {
  return new DocumentFlowError(ErrorCode.ExportFailed, `Export failed: ${reason}`, cause);
}

export function workerUnavailable(reason: string, cause?: unknown): DocumentFlowError {
  return new DocumentFlowError(ErrorCode.WorkerUnavailable, `Worker unavailable: ${reason}`, cause);
}

export function isDocumentFlowError(e: unknown): e is DocumentFlowError {
  return e instanceof DocumentFlowError;
}
