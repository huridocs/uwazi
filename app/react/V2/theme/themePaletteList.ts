import { PRESET_DEFINITIONS } from './tokens.js';
import type { ThemePaletteEntry } from './tokens.js';

const defaultLight = PRESET_DEFINITIONS.default.modes.light;

const THEME_PALETTE: ThemePaletteEntry[] = [
  {
    id: 'accent-primary',
    semanticKey: '--color-theme-accent-primary',
    hex: defaultLight['--color-theme-accent-primary'],
  },
  {
    id: 'accent-supporting',
    semanticKey: '--color-theme-accent-supporting',
    hex: defaultLight['--color-theme-accent-supporting'],
  },
  {
    id: 'accent-emphasis',
    semanticKey: '--color-theme-accent-emphasis',
    hex: defaultLight['--color-theme-accent-emphasis'],
  },
  {
    id: 'bg-muted',
    semanticKey: '--color-theme-bg-muted',
    hex: defaultLight['--color-theme-bg-muted'],
  },
  {
    id: 'bg-primary',
    semanticKey: '--color-theme-bg-primary',
    hex: defaultLight['--color-theme-bg-primary'],
  },
  {
    id: 'bg-surface',
    semanticKey: '--color-theme-bg-surface',
    hex: defaultLight['--color-theme-bg-surface'],
  },
];

export { THEME_PALETTE };
