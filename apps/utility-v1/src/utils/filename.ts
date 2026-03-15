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
