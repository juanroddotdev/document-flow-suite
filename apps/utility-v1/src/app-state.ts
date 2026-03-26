/**
 * Shared types and constants for the document flow app.
 */

export interface PageState {
  id: string;
  blob: Blob;
  previewDataUrl?: string;
  filename: string;
  status: 'processing' | 'ready';
  rotation: 0 | 90 | 180 | 270;
}

/** A package of pages (one island per uploaded file by default). */
export interface IslandState {
  id: string;
  /** Display label, usually source filename */
  label: string;
  pages: PageState[];
  /** When pages.length > 4, expanded shows full grid; collapsed shows stacked first 4 only. */
  expanded?: boolean;
}

export function flattenPagesInIslandOrder(islands: IslandState[]): PageState[] {
  return islands.flatMap((i) => i.pages);
}

export function findPageLocation(
  islands: IslandState[],
  pageId: string
): { islandIndex: number; pageIndex: number } | null {
  for (let i = 0; i < islands.length; i++) {
    const j = islands[i].pages.findIndex((p) => p.id === pageId);
    if (j !== -1) return { islandIndex: i, pageIndex: j };
  }
  return null;
}

export const VIRTUAL_ITEM_SIZE = 160;
export const VIRTUAL_GAP = 16;
export const VIRTUAL_ROW_HEIGHT = VIRTUAL_ITEM_SIZE + VIRTUAL_GAP;

export const FILE_INPUT_ACCEPT =
  '.heic,.tif,.tiff,.png,.jpg,.jpeg,.pdf,image/heic,image/tiff,image/png,image/jpeg,application/pdf';
