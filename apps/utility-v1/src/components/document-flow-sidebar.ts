import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { CardStyle } from '../tabletop/tabletop-render.js';

@customElement('document-flow-sidebar')
export class DocumentFlowSidebar extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 20rem;
      background: white;
      border-left: 1px solid #e2e8f0;
      padding: 1rem;
      box-sizing: border-box;
    }
    h2 {
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
    .page-count {
      font-size: 0.875rem;
      color: #475569;
    }
    .label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .style-row {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
    }
    .style-btn {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
      border-radius: 0.375rem;
      border: none;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .style-btn.active {
      background: #1e293b;
      color: white;
    }
    .style-btn:not(.active) {
      background: #f1f5f9;
      color: #475569;
    }
    .style-btn:not(.active):hover {
      background: #e2e8f0;
    }
    .btn-add {
      padding: 0.5rem 1rem;
      border: 2px dashed #94a3b8;
      color: #475569;
      border-radius: 0.5rem;
      background: transparent;
      cursor: pointer;
    }
    .btn-add:hover {
      border-color: #64748b;
      background: #f8fafc;
    }
    .btn-export {
      padding: 0.5rem 1rem;
      background: #1e293b;
      color: white;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
    }
    .btn-export:hover:not(:disabled) {
      background: #334155;
    }
    .btn-export:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .footer {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: auto;
    }
  `;

  @property({ type: Number }) pageCount = 0;
  @property({ type: String }) cardStyle: CardStyle = 'glass';

  private emitCardStyle(style: CardStyle): void {
    this.cardStyle = style;
    this.dispatchEvent(
      new CustomEvent('card-style-change', { detail: style, bubbles: true, composed: true })
    );
  }

  private emitAddFiles(): void {
    this.dispatchEvent(new CustomEvent('add-files', { bubbles: true, composed: true }));
  }

  private emitExport(): void {
    this.dispatchEvent(new CustomEvent('export-requested', { bubbles: true, composed: true }));
  }

  override render() {
    const hasPages = this.pageCount > 0;
    return html`
      <h2>Actions</h2>
      ${hasPages ? html`<p class="page-count">${this.pageCount} page${this.pageCount !== 1 ? 's' : ''}</p>` : ''}
      <div>
        <span class="label">Card style</span>
        <div class="style-row" role="group" aria-label="Card style">
          <button
            type="button"
            class="style-btn ${this.cardStyle === 'glass' ? 'active' : ''}"
            @click=${() => this.emitCardStyle('glass')}
          >
            Glass
          </button>
          <button
            type="button"
            class="style-btn ${this.cardStyle === 'capsule' ? 'active' : ''}"
            @click=${() => this.emitCardStyle('capsule')}
          >
            Capsule
          </button>
          <button
            type="button"
            class="style-btn ${this.cardStyle === 'action-first' ? 'active' : ''}"
            @click=${() => this.emitCardStyle('action-first')}
          >
            Action
          </button>
        </div>
      </div>
      ${hasPages
        ? html`<button type="button" class="btn-add" @click=${this.emitAddFiles}>+ Add files</button>`
        : ''}
      <button
        type="button"
        class="btn-export"
        ?disabled=${!hasPages}
        @click=${this.emitExport}
      >
        Create 1 Combined PDF
      </button>
      <p class="footer">DocumentFlow Suite v1</p>
    `;
  }
}
