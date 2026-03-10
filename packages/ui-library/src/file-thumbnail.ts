import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

const rotateIcon = html`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>`;

const trashIcon = html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;

@customElement('file-thumbnail')
export class FileThumbnail extends LitElement {
  static styles = css`
    :host {
      display: block;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      background: #f9fafb;
    }
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem;
    }
    .preview-wrapper {
      position: relative;
      display: inline-block;
    }
    .preview {
      width: 80px;
      height: 80px;
      object-fit: contain;
      background: #fff;
      border-radius: 4px;
      display: block;
      transition: transform 0.2s ease;
    }
    .preview.rotated {
      transform: rotate(90deg);
    }
    .page-badge {
      position: absolute;
      top: 4px;
      left: 4px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #2563eb;
      color: white;
      font-size: 0.7rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }
    .thumbnail-actions {
      position: absolute;
      inset: 0;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 1;
      pointer-events: none;
    }
    :host(:hover) .thumbnail-actions {
      opacity: 1;
      pointer-events: auto;
    }
    .action-rotate {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.95);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #374151;
    }
    .action-rotate:hover {
      background: white;
    }
    .action-rotate:active {
      transform: scale(0.95);
    }
    .action-trash {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: #b91c1c;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .action-trash:hover {
      background: #991b1b;
    }
    .filename {
      font-size: 0.75rem;
      color: #374151;
      margin-top: 0.5rem;
      text-align: center;
      word-break: break-all;
    }
    .status-overlay {
      position: absolute;
      inset: 0;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.8);
      z-index: 3;
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #e5e7eb;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .check-badge {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #16a34a;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }
    .check-badge svg {
      width: 12px;
      height: 12px;
    }
  `;

  @property({ type: String })
  preview: string = '';

  @property({ type: String })
  filename: string = '';

  @property({ type: Number, attribute: 'page-index' })
  pageIndex: number = 0;

  @property({ type: String })
  status: 'processing' | 'ready' = 'ready';

  private _onRotate(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('rotate', { bubbles: true }));
  }

  private _onDelete(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('delete', { bubbles: true }));
  }

  render() {
    return html`
      <div class="container">
        <div class="preview-wrapper">
          ${this.preview
            ? html`<img class="preview" src="${this.preview}" alt="${this.filename}" />`
            : html`<div class="preview" style="display:flex;align-items:center;justify-content:center;color:#9ca3af;">No preview</div>`}
          ${this.pageIndex >= 1 ? html`<span class="page-badge">${this.pageIndex}</span>` : ''}
          ${this.status === 'processing'
            ? html`
                <div class="status-overlay">
                  <div class="spinner"></div>
                </div>
              `
            : this.status === 'ready' && this.preview
              ? html`
                  <span class="check-badge" title="Ready">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                `
              : ''}
          <div class="thumbnail-actions">
            <button type="button" class="action-rotate" @click="${this._onRotate}" title="Rotate 90°">${rotateIcon}</button>
            <button type="button" class="action-trash" @click="${this._onDelete}" title="Remove">${trashIcon}</button>
          </div>
        </div>
        <span class="filename">${this.filename}</span>
      </div>
    `;
  }
}
