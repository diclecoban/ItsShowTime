export const accent = 'var(--accent)';
export const gold = 'var(--gold)';
export const ink = 'var(--ink)';
export const bg = 'var(--bg)';
export const panel = 'var(--panel)';
export const muted = 'var(--muted)';

export type ThemeName = 'Pantone 1' | 'Pantone 2 Light';

export const themes: Record<ThemeName, Record<string, string>> = {
  'Pantone 1': {
    '--accent': '#6f9c2f',
    '--gold': '#e74536',
    '--ink': '#f8f8f9',
    '--bg': '#0b1009',
    '--panel': '#182014',
    '--muted': '#b8c1ad',
  },
  'Pantone 2 Light': {
    '--accent': '#5e6542',
    '--gold': '#c74656',
    '--ink': '#1d1e16',
    '--bg': '#f6eee4',
    '--panel': '#fffaf2',
    '--muted': '#756f64',
  },
};
