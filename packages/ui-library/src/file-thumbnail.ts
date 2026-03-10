import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

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
    }
    .filename {
      font-size: 0.75rem;
      color: #374151;
      margin-top: 0.5rem;
      text-align: center;
      word-break: break-all;
    }
    button {
      margin-top: 0.5rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
    }
    button {
      margin-left: 0.25rem;
    }
    button:first-of-type {
      margin-left: 0;
    }
    button:hover {
      background: #f3f4f6;
    }
    .delete-btn {
      color: #b91c1c;
      border-color: #fecaca;
      background: #fef2f2;
    }
    .delete-btn:hover {
      background: #fee2e2;
    }
  `;

  @property({ type: String })
  preview: string = '';

  @property({ type: String })
  filename: string = '';

  @property({ type: Number, attribute: 'page-index' })
  pageIndex: number = 0;

  private _onRotate() {
    this.dispatchEvent(new CustomEvent('rotate', { bubbles: true }));
  }

  private _onDelete() {
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
        </div>
        <span class="filename">${this.filename}</span>
        <div>
          <button @click="${this._onRotate}">Rotate 90°</button>
          <button class="delete-btn" @click="${this._onDelete}">Remove</button>
        </div>
      </div>
    `;
  }
}
