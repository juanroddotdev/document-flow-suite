import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { ToastDetail } from '../utils/toast.js';

const TOAST_EVENT = 'document-flow-toast';

@customElement('toast-container')
export class ToastContainer extends LitElement {
  static styles = css`
    :host {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      max-width: min(36rem, calc(100vw - 2rem));
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      animation: slideUp 0.2s ease-out;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .toast--success {
      background: #dcfce7;
      border: 1px solid #86efac;
      color: #166534;
    }
    .toast--error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .toast-message {
      font-size: 0.9375rem;
      font-weight: 500;
      line-height: 1.4;
      word-break: break-word;
      max-height: 12rem;
      overflow-y: auto;
    }
    .toast-details {
      font-size: 0.8125rem;
      opacity: 0.9;
      line-height: 1.3;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 8rem;
      overflow-y: auto;
    }
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(0.5rem);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  @state() private current: ToastDetail | null = null;
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener(TOAST_EVENT, this.handleToast as EventListener);
  }

  override disconnectedCallback(): void {
    document.removeEventListener(TOAST_EVENT, this.handleToast as EventListener);
    if (this.dismissTimer) clearTimeout(this.dismissTimer);
    super.disconnectedCallback();
  }

  private handleToast = (e: CustomEvent<ToastDetail>): void => {
    if (this.dismissTimer) clearTimeout(this.dismissTimer);
    this.current = e.detail;
    const duration = e.detail.duration ?? (e.detail.type === 'error' ? 8000 : 4000);
    this.dismissTimer = setTimeout(() => {
      this.current = null;
      this.dismissTimer = null;
    }, duration);
  };

  override render() {
    if (!this.current) return html``;
    const { message, type, details } = this.current;
    return html`
      <div class="toast toast--${type}" role="status" aria-live="polite">
        <div class="toast-message">${message}</div>
        ${details ? html`<div class="toast-details">${details}</div>` : ''}
      </div>
    `;
  }
}
