/**
 * Geometry for thumbnail insert-before slot (raw + hysteresis). Used by ThumbnailDragController.
 */

/** Pixels each side of cell midline: keep previous insert-before target while pointer stays in band. */
const NEUTRAL_BAND_PX = 12;

/** Thumbnail slots (not placeholder, not dragging) + optional add-card sentinel, in DOM order. */
function getThumbnailSlots(flex: HTMLElement, ph: HTMLElement): HTMLElement[] {
  return Array.from(flex.children).filter(
    (el): el is HTMLElement =>
      el !== ph &&
      el instanceof HTMLElement &&
      el.classList.contains('thumbnail-item') &&
      el.hasAttribute('data-page-id') &&
      el.getAttribute('data-dragging') !== 'true'
  );
}

export function getSlotKey(el: HTMLElement): string {
  if (el.hasAttribute('data-add-card')) return '__add__';
  return el.getAttribute('data-page-id') ?? '';
}

export function computeRawInsertBeforeTarget(
  flex: HTMLElement,
  ph: HTMLElement,
  clientX: number,
  clientY: number
): { targetEl: HTMLElement; pushedEl: HTMLElement | null } | null {
  const addCard = flex.querySelector('[data-add-card]') as HTMLElement | null;
  const slots = getThumbnailSlots(flex, ph);
  if (slots.length === 0) {
    return addCard ? { targetEl: addCard, pushedEl: null } : null;
  }

  const cx = clientX;
  const cy = clientY;

  let containing: HTMLElement | null = null;
  for (const el of slots) {
    const r = el.getBoundingClientRect();
    if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
      containing = el;
      break;
    }
  }

  let pushedEl: HTMLElement | null = null;
  let targetEl: HTMLElement;

  if (containing) {
    pushedEl = containing;
    const r = containing.getBoundingClientRect();
    const midX = r.left + r.width / 2;
    const idx = slots.indexOf(containing);
    if (cx < midX) {
      targetEl = containing;
    } else {
      targetEl = slots[idx + 1] ?? addCard ?? containing;
    }
  } else {
    let best = slots[0];
    let bestD = Infinity;
    for (const el of slots) {
      const r = el.getBoundingClientRect();
      const mx = r.left + r.width / 2;
      const my = r.top + r.height / 2;
      const d = Math.abs(cx - mx) + Math.abs(cy - my);
      if (d < bestD) {
        bestD = d;
        best = el;
      }
    }
    pushedEl = best;
    const r = best.getBoundingClientRect();
    const midX = r.left + r.width / 2;
    const idx = slots.indexOf(best);
    if (cx < midX) {
      targetEl = best;
    } else {
      targetEl = slots[idx + 1] ?? addCard ?? best;
    }
  }

  if (!targetEl) return null;
  return { targetEl, pushedEl };
}

/**
 * Workstation-style slot from pointer vs cell rects (grid-safe): insert placeholder before this node.
 * Optional `lastStableTarget` + neutral band around cell midline reduces mid-edge oscillation.
 */
export function resolveInsertBeforeTarget(
  flex: HTMLElement,
  ph: HTMLElement,
  clientX: number,
  clientY: number,
  lastStableTarget?: HTMLElement | null
): { targetEl: HTMLElement; pushedEl: HTMLElement | null } | null {
  const raw = computeRawInsertBeforeTarget(flex, ph, clientX, clientY);
  if (!raw) return null;
  if (lastStableTarget == null || !flex.contains(lastStableTarget)) return raw;
  if (raw.targetEl === lastStableTarget) return raw;
  const pivot = raw.pushedEl;
  if (!pivot) return raw;
  const r = pivot.getBoundingClientRect();
  const midX = r.left + r.width / 2;
  if (Math.abs(clientX - midX) <= NEUTRAL_BAND_PX) {
    return { targetEl: lastStableTarget, pushedEl: raw.pushedEl };
  }
  return raw;
}

/** Clamp pointer into rect so raw slot resolution still picks a nearest index when outside the strip. */
export function clampPointToRect(
  rect: DOMRect,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  return {
    x: Math.min(Math.max(clientX, rect.left), rect.right),
    y: Math.min(Math.max(clientY, rect.top), rect.bottom),
  };
}
