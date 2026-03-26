const THEME_KEY = 'documentflow-theme';

export type ThemePreference = 'light' | 'dark';

export function getStoredTheme(): ThemePreference | null {
  const v = localStorage.getItem(THEME_KEY);
  if (v === 'light' || v === 'dark') return v;
  return null;
}

/** Effective theme: saved preference, or system `prefers-color-scheme`. */
export function getResolvedTheme(): ThemePreference {
  const s = getStoredTheme();
  if (s) return s;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(mode: ThemePreference): void {
  document.documentElement.classList.toggle('dark', mode === 'dark');
  localStorage.setItem(THEME_KEY, mode);
  window.dispatchEvent(new CustomEvent('documentflow-theme-change', { detail: mode }));
}

/** Call once at startup: applies stored preference, or system theme without persisting. */
export function initTheme(): void {
  const s = getStoredTheme();
  if (s) {
    document.documentElement.classList.toggle('dark', s === 'dark');
    return;
  }
  const system: ThemePreference = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
  document.documentElement.classList.toggle('dark', system === 'dark');
}

export function toggleTheme(): void {
  applyTheme(getResolvedTheme() === 'dark' ? 'light' : 'dark');
}
