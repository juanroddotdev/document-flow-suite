import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('preview-lightbox')
export class PreviewLightbox extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 100;
      background: rgba(15, 23, 42, 0.75);
      padding: 1rem;
      box-sizing: border-box;
      overflow: auto;
    }
    .panel {
      max-width: min(96vw, 1200px);
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      min-height: min(90vh, 920px);
      justify-content: center;
    }
    .toolbar {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.5rem;
      flex-shrink: 0;
    }
    .filename {
      color: #f1f5f9;
      font-size: 0.875rem;
      word-break: break-all;
      text-align: left;
      flex: 1;
      min-width: 0;
    }
    .close-btn {
      flex-shrink: 0;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.5rem;
      border: none;
      background: rgba(255, 255, 255, 0.12);
      color: #f8fafc;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .frame {
      max-height: min(85vh, 900px);
      width: auto;
      height: auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .frame img {
      max-width: 100%;
      max-height: min(85vh, 900px);
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: 0.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
  `;

  @property({ type: Boolean }) open = false;
  @property({ type: String }) src = '';
  @property({ type: String }) filename = '';

  private _onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.open) this._close();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('keydown', this._onKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this._onKeydown);
  }

  private _close(): void {
    this.open = false;
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  override render() {
    if (!this.open || !this.src) return html``;
    return html`
      <div class="backdrop" @click=${this._close}>
        <div
          class="panel"
          role="dialog"
          aria-modal="true"
          aria-label=${`Preview: ${this.filename || 'Page'}`}
          @click=${(e: Event) => e.stopPropagation()}
        >
          <div class="toolbar">
            <span class="filename">${this.filename}</span>
            <button type="button" class="close-btn" @click=${this._close} aria-label="Close preview">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="frame">
            <img src=${this.src} alt=${this.filename} />
          </div>
        </div>
      </div>
    `;
  }
}
