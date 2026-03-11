/**
 * Debug logging for the document-flow app. Enable via localStorage or query param.
 *
 * Enable all: localStorage.setItem('docflow:debug', '1') or ?docflow_debug=1
 * Enable areas: localStorage.setItem('docflow:debug', 'drag,virtual,render')
 * Areas: drag (drag/drop), virtual (visible thumbnails), render (tabletop/layout)
 */

const DEBUG_KEY = 'docflow:debug';

function isEnabled(area: string): boolean {
  if (typeof window === 'undefined') return false;
  const param = new URLSearchParams(window.location.search).get('docflow_debug');
  if (param !== null) return param === '1' || param === 'true' || param.split(',').includes(area);
  try {
    const val = localStorage.getItem(DEBUG_KEY);
    if (!val) return false;
    if (val === '1' || val === 'true') return true;
    return val.split(',').map((s) => s.trim()).includes(area);
  } catch {
    return false;
  }
}

export function log(area: string, message: string, ...data: unknown[]): void {
  if (!isEnabled(area)) return;
  const prefix = `[DocFlow:${area}]`;
  if (data.length > 0) {
    console.log(prefix, message, ...data);
  } else {
    console.log(prefix, message);
  }
}

export function warn(area: string, message: string, ...data: unknown[]): void {
  if (!isEnabled(area)) return;
  console.warn(`[DocFlow:${area}]`, message, ...data);
}

export function error(area: string, message: string, ...data: unknown[]): void {
  console.error(`[DocFlow:${area}]`, message, ...data);
}
