import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

const rotateIcon = html`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>`;

const trashIcon = html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;

@customElement('file-thumbnail')
export class FileThumbnail extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 160px;
    }
    .container {
      width: 160px;
      height: 160px;
      position: relative;
    }
    .preview-wrapper {
      position: relative;
      width: 160px;
      height: 160px;
      border-radius: 12px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      background: #f9fafb;
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    :host(:hover) .preview-wrapper {
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 8px 24px rgba(0, 0, 0, 0.08);
    }
    .preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
      background: #fff;
      display: block;
      transition: transform 0.2s ease;
    }
    .preview-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
      font-size: 0.75rem;
    }
    .preview.rotated {
      transform: rotate(90deg);
    }
    .page-badge {
      position: absolute;
      top: 6px;
      left: 6px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #2563eb;
      color: white;
      font-size: 0.7rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 4;
      border: 2px solid white;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.08);
    }
    .thumbnail-actions {
      position: absolute;
      inset: 0;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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
    .filename-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 0.7rem;
      text-align: center;
      word-break: break-all;
      line-height: 1.2;
      z-index: 3;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    .status-overlay {
      position: absolute;
      inset: 0;
      border-radius: 12px;
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
      bottom: 6px;
      right: 6px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #16a34a;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 4;
      border: 2px solid white;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.08);
    }
    .check-badge svg {
      width: 12px;
      height: 12px;
    }
    /* Option 2: Capsule - filename below card */
    .filename-caption {
      margin-top: 6px;
      font-size: 0.75rem;
      color: #334155;
      text-align: center;
      word-break: break-all;
      line-height: 1.2;
    }
    .filename-with-status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .check-inline {
      flex-shrink: 0;
      color: #16a34a;
      display: flex;
    }
    .check-inline svg {
      width: 12px;
      height: 12px;
    }
    /* Option 3: Action-first - minimal border, pop on hover */
    :host([card-style="action-first"]) .preview-wrapper {
      border: 1px solid #e2e8f0;
    }
    :host([card-style="action-first"]) .filename-overlay {
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    :host([card-style="action-first"]:hover) .filename-overlay {
      opacity: 1;
    }
    :host([card-style="action-first"]) .thumbnail-actions {
      transform: scale(0.95);
      transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    :host([card-style="action-first"]:hover) .thumbnail-actions {
      transform: scale(1);
    }
    /* Side handle: vertical strip on the left, pops up on hover */
    .drag-handle-side {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 14px;
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.08);
      border-radius: 12px 0 0 12px;
      cursor: grab;
      opacity: 0;
      transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .drag-handle-side:active {
      cursor: grabbing;
    }
    :host(:hover) .drag-handle-side,
    .drag-handle-side:hover {
      opacity: 1;
    }
    .drag-handle-side .six-dots {
      display: flex;
      gap: 2px;
    }
    .drag-handle-side .six-dots .col {
      display: flex;
      flex-direction: column;
      gap: 2px;
      align-items: center;
    }
    .drag-handle-side .six-dots span {
      width: 2px;
      height: 2px;
      border-radius: 50%;
      background: #64748b;
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

  @property({ type: String, attribute: 'card-style' })
  cardStyle: 'glass' | 'capsule' | 'action-first' = 'glass';

  @property({ type: String, attribute: 'drag-handle-style' })
  dragHandleStyle: 'whole-card' | 'side-handle' | 'bent-corner' = 'whole-card';

  private _onRotate(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('rotate', { bubbles: true }));
  }

  private _onDelete(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('delete', { bubbles: true }));
  }

  render() {
    const showOverlay = this.cardStyle === 'glass' || this.cardStyle === 'action-first';
    const showCheckBadge = this.cardStyle === 'glass' && this.status === 'ready' && this.preview;
    const showCapsuleCaption = this.cardStyle === 'capsule';

    const showSideHandle = this.dragHandleStyle === 'side-handle';

    return html`
      <div class="container">
        <div class="preview-wrapper">
          ${showSideHandle
            ? html`
                <div
                  class="drag-handle-side"
                  data-drag-handle
                  draggable="true"
                  title="Drag to reorder"
                  aria-label="Drag to reorder"
                >
                  <div class="six-dots">
                    <div class="col"><span></span><span></span><span></span></div>
                    <div class="col"><span></span><span></span><span></span></div>
                  </div>
                </div>
              `
            : ''}
          ${this.preview
            ? html`<img class="preview" src="${this.preview}" alt="${this.filename}" />`
            : html`<div class="preview preview-empty">No preview</div>`}
          ${this.pageIndex >= 1 ? html`<span class="page-badge">${this.pageIndex}</span>` : ''}
          ${this.status === 'processing'
            ? html`
                <div class="status-overlay">
                  <div class="spinner"></div>
                </div>
              `
            : showCheckBadge
              ? html`
                  <span class="check-badge" title="Ready">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                `
              : ''}
          ${showOverlay ? html`<div class="filename-overlay">${this.filename}</div>` : ''}
          <div class="thumbnail-actions">
            <button type="button" class="action-rotate" @click="${this._onRotate}" title="Rotate 90°">${rotateIcon}</button>
            <button type="button" class="action-trash" @click="${this._onDelete}" title="Remove">${trashIcon}</button>
          </div>
        </div>
        ${showCapsuleCaption
          ? html`
              <div class="filename-caption">
                <div class="filename-with-status">
                  ${this.status === 'ready' && this.preview
                    ? html`<span class="check-inline"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></span>`
                    : ''}
                  <span>${this.filename}</span>
                </div>
              </div>
            `
          : ''}
      </div>
    `;
  }
}
