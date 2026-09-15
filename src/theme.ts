export const accent = 'var(--accent)';
export const gold = 'var(--gold)';
export const ink = 'var(--ink)';
export const bg = 'var(--bg)';
export const panel = 'var(--panel)';
export const muted = 'var(--muted)';
export const border = 'var(--border)';
export const danger = 'var(--danger)';
export const nav = 'var(--nav)';
export const softPanel = 'var(--soft-panel)';
export const softText = 'var(--soft-text)';

export type ThemeName = 'Pantone 1' | 'Pantone 2 Light';

export const themes: Record<ThemeName, Record<string, string>> = {
  'Pantone 1': {
    '--accent': '#6f9c2f',
    '--gold': '#e74536',
    '--ink': '#f8f8f9',
    '--bg': '#0b1009',
    '--panel': '#182014',
    '--muted': '#b8c1ad',
    '--border': '#252820',
    '--danger': '#e74536',
    '--nav': '#050605',
    '--soft-panel': '#11130f',
    '--soft-text': '#d7dccf',
  },
  'Pantone 2 Light': {
    '--accent': '#5e6542',
    '--gold': '#c74656',
    '--ink': '#1d1e16',
    '--bg': '#f6eee4',
    '--panel': '#fffaf2',
    '--muted': '#756f64',
    '--border': '#ded3c5',
    '--danger': '#b83c48',
    '--nav': '#efe3d4',
    '--soft-panel': '#f2e7d9',
    '--soft-text': '#5f5b50',
  },
};
