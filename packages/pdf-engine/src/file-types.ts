/**
 * File type guards (shared by main thread and worker).
 */

export function isHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type.includes('heic') ||
    type.includes('heif')
  );
}

export function isTiff(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return name.endsWith('.tiff') || name.endsWith('.tif') || type.includes('tiff');
}

export function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function isRasterImage(file: File): boolean {
  const type = file.type.toLowerCase();
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'].includes(
    type
  );
}
