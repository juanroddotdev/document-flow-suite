/**
 * Toast feedback — dispatches events that toast-container listens for.
 * Use for success and error feedback so users see what happened.
 */

export interface ToastDetail {
  message: string;
  type: 'success' | 'error';
  /** Optional secondary/details text (e.g. technical reason) */
  details?: string;
  /** Auto-dismiss after ms. Default: success 4s, error 8s */
  duration?: number;
}

const TOAST_EVENT = 'document-flow-toast';

export function showToast(
  message: string,
  type: 'success' | 'error',
  options?: { details?: string; duration?: number }
): void {
  const detail: ToastDetail = {
    message,
    type,
    details: options?.details,
    duration: options?.duration ?? (type === 'error' ? 8000 : 4000),
  };
  document.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail }));
}
