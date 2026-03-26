import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { CardStyle } from '../tabletop/tabletop-render.js';
import { getResolvedTheme, toggleTheme, type ThemePreference } from '../utils/theme.js';

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
    :host-context(.dark) {
      background: #0f172a;
      border-left-color: #334155;
    }
    h2 {
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
    :host-context(.dark) h2 {
      color: #f1f5f9;
    }
    .theme-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 0.25rem;
    }
    .btn-theme {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #475569;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .btn-theme:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    :host-context(.dark) .btn-theme {
      border-color: #475569;
      background: #1e293b;
      color: #cbd5e1;
    }
    :host-context(.dark) .btn-theme:hover {
      background: #334155;
      border-color: #64748b;
    }
    .page-count {
      font-size: 0.875rem;
      color: #475569;
    }
    :host-context(.dark) .page-count {
      color: #94a3b8;
    }
    .label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    :host-context(.dark) .label {
      color: #94a3b8;
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
    :host-context(.dark) .style-btn.active {
      background: #e2e8f0;
      color: #0f172a;
    }
    .style-btn:not(.active) {
      background: #f1f5f9;
      color: #475569;
    }
    :host-context(.dark) .style-btn:not(.active) {
      background: #1e293b;
      color: #94a3b8;
    }
    .style-btn:not(.active):hover {
      background: #e2e8f0;
    }
    :host-context(.dark) .style-btn:not(.active):hover {
      background: #334155;
      color: #e2e8f0;
    }
    .btn-add {
      padding: 0.5rem 1rem;
      border: 2px dashed #94a3b8;
      color: #475569;
      border-radius: 0.5rem;
      background: transparent;
      cursor: pointer;
    }
    :host-context(.dark) .btn-add {
      border-color: #64748b;
      color: #cbd5e1;
    }
    .btn-add:hover {
      border-color: #64748b;
      background: #f8fafc;
    }
    :host-context(.dark) .btn-add:hover {
      border-color: #94a3b8;
      background: #1e293b;
    }
    .btn-export {
      padding: 0.5rem 1rem;
      background: #1e293b;
      color: white;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
    }
    :host-context(.dark) .btn-export {
      background: #e2e8f0;
      color: #0f172a;
    }
    .btn-export:hover:not(:disabled) {
      background: #334155;
    }
    :host-context(.dark) .btn-export:hover:not(:disabled) {
      background: white;
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
    :host-context(.dark) .footer {
      color: #64748b;
    }
  `;

  @property({ type: Number }) pageCount = 0;
  @property({ type: String }) cardStyle: CardStyle = 'glass';
  @state() private uiTheme: ThemePreference = 'light';

  private boundTheme = (): void => {
    this.uiTheme = getResolvedTheme();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.uiTheme = getResolvedTheme();
    window.addEventListener('documentflow-theme-change', this.boundTheme);
  }

  override disconnectedCallback(): void {
    window.removeEventListener('documentflow-theme-change', this.boundTheme);
    super.disconnectedCallback();
  }

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

  private onThemeClick(): void {
    toggleTheme();
    this.uiTheme = getResolvedTheme();
  }

  override render() {
    const hasPages = this.pageCount > 0;
    const isDark = this.uiTheme === 'dark';
    return html`
      <div class="theme-row">
        <button
          type="button"
          class="btn-theme"
          @click=${this.onThemeClick}
          aria-label=${isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title=${isDark ? 'Light mode' : 'Dark mode'}
        >
          ${isDark
            ? html`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`
            : html`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`}
        </button>
      </div>
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
