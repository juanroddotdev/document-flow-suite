/**
 * Pre-flight validation for uploaded files.
 * Rejects 0-byte files and files over 100MB before processing.
 */

export interface PreflightResult {
  valid: File[];
  errors: { fileName: string; reason: string }[];
}

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export function validateFiles(files: FileList): PreflightResult {
  const valid: File[] = [];
  const errors: { fileName: string; reason: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.size === 0) {
      errors.push({ fileName: file.name, reason: 'File is empty (0 bytes).' });
      continue;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push({
        fileName: file.name,
        reason: 'File is over 100MB. Large files may slow or freeze the browser.',
      });
      continue;
    }
    valid.push(file);
  }

  return { valid, errors };
}
