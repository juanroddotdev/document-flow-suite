import { vi } from 'vitest';

if (typeof globalThis.Worker === 'undefined') {
  globalThis.Worker = vi.fn(() => ({
    postMessage: vi.fn(),
    terminate: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof Worker;
}
