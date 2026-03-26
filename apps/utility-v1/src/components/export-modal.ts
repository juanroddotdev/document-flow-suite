import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { sanitizeFilename } from '../utils/filename.js';

@customElement('export-modal')
export class ExportModal extends LitElement {
  static styles = css`
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
      padding: 1rem;
    }
    .card {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      width: 100%;
      max-width: 28rem;
    }
    :host-context(.dark) .card {
      background: #1e293b;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
    }
    .heading {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    :host-context(.dark) .heading {
      color: #f1f5f9;
    }
    input {
      width: 100%;
      padding: 0.5rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      box-sizing: border-box;
    }
    :host-context(.dark) input {
      background: #0f172a;
      border-color: #475569;
      color: #f1f5f9;
    }
    input:focus {
      outline: none;
      ring: 2px;
      border-color: #64748b;
    }
    .btn-row {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }
    .btn-cancel {
      padding: 0.5rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      color: #334155;
      background: white;
    }
    :host-context(.dark) .btn-cancel {
      border-color: #475569;
      color: #e2e8f0;
      background: #0f172a;
    }
    .btn-cancel:hover {
      background: #f8fafc;
    }
    :host-context(.dark) .btn-cancel:hover {
      background: #334155;
    }
    .btn-export {
      padding: 0.5rem 1rem;
      background: #1e293b;
      color: white;
      border-radius: 0.5rem;
      border: none;
    }
    :host-context(.dark) .btn-export {
      background: #e2e8f0;
      color: #0f172a;
    }
    .btn-export:hover {
      background: #334155;
    }
    :host-context(.dark) .btn-export:hover {
      background: white;
    }
  `;

  @property({ type: Boolean }) open = false;
  @property({ type: String }) defaultFilename = '';
  @state() private inputValue = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.inputValue = this.defaultFilename.replace('.pdf', '');
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('defaultFilename')) {
      this.inputValue = this.defaultFilename.replace('.pdf', '');
    }
  }

  private handleExport(): void {
    const raw = this.inputValue.trim() || this.defaultFilename.replace('.pdf', '');
    const filename = sanitizeFilename(raw) || this.defaultFilename;
    this.dispatchEvent(new CustomEvent('export-name', { detail: filename, bubbles: true }));
    this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
  }

  private handleCancel(): void {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
  }

  private handleBackdropClick(e: Event): void {
    if (e.target === e.currentTarget) this.handleCancel();
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') this.handleExport();
    if (e.key === 'Escape') this.handleCancel();
  }

  override render() {
    if (!this.open) return html``;
    return html`
      <div
        class="backdrop"
        id="export-modal-backdrop"
        role="dialog"
        aria-label="Name your document"
        @click=${this.handleBackdropClick}
      >
        <div class="card">
          <h3 class="heading">Name your document</h3>
          <input
            type="text"
            .value=${this.inputValue}
            placeholder="Document name"
            @input=${(e: Event) => {
              this.inputValue = (e.target as HTMLInputElement).value;
            }}
            @keydown=${this.handleKeydown}
          />
          <div class="btn-row">
            <button type="button" class="btn-cancel" @click=${this.handleCancel}>Cancel</button>
            <button type="button" class="btn-export" @click=${this.handleExport}>Export</button>
          </div>
        </div>
      </div>
    `;
  }
}
