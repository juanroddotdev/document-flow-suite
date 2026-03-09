import { describe, it, expect, beforeEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import { FileThumbnail } from './file-thumbnail.js';

describe('FileThumbnail', () => {
  beforeEach(async () => {
    await fixture(html`<file-thumbnail></file-thumbnail>`);
  });

  it('is defined', () => {
    const el = document.createElement('file-thumbnail');
    expect(el).toBeInstanceOf(FileThumbnail);
  });

  it('shows filename', async () => {
    const el = await fixture<FileThumbnail>(html`<file-thumbnail filename="test.pdf"></file-thumbnail>`);
    await el.updateComplete;
    const span = el.shadowRoot?.querySelector('.filename');
    expect(span?.textContent).toBe('test.pdf');
  });

  it('shows "No preview" when preview is empty', async () => {
    const el = await fixture<FileThumbnail>(html`<file-thumbnail filename="x.png"></file-thumbnail>`);
    await el.updateComplete;
    const placeholder = el.shadowRoot?.querySelector('.preview');
    expect(placeholder?.textContent?.trim()).toContain('No preview');
  });

  it('shows image when preview is set', async () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
    const el = await fixture<FileThumbnail>(html`<file-thumbnail filename="x.png"></file-thumbnail>`);
    el.preview = dataUrl;
    await el.updateComplete;
    const img = el.shadowRoot?.querySelector('.preview');
    expect(img?.tagName).toBe('IMG');
    expect((img as HTMLImageElement).src).toBe(dataUrl);
  });

  it('dispatches rotate event when button is clicked', async () => {
    const el = await fixture<FileThumbnail>(html`<file-thumbnail filename="x.png"></file-thumbnail>`);
    await el.updateComplete;
    let rotated = false;
    el.addEventListener('rotate', () => {
      rotated = true;
    });
    const button = el.shadowRoot?.querySelector('button');
    expect(button).toBeTruthy();
    button?.click();
    expect(rotated).toBe(true);
  });
});
