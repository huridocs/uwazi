import { checkContrast } from '#shared/utils/contrast.js';

const HEADER_CONTRAST_PAIRS = [
  {
    id: 'header-text',
    label: 'Header bar text',
    background: '--color-theme-chrome-app-bar',
    foreground: '--color-theme-chrome-app-bar-fg',
  },
  {
    id: 'header-buttons',
    label: 'Header bar hover background',
    background: '--color-theme-chrome-app-bar-hover',
    foreground: '--color-theme-chrome-app-bar-fg',
  },
  {
    id: 'header-active',
    label: 'Header bar active background',
    background: '--color-theme-chrome-app-bar-active',
    foreground: '--color-theme-chrome-app-bar-fg',
  },
] as const;

const headerContrastChecks = (colors: Record<string, string | undefined>) =>
  HEADER_CONTRAST_PAIRS.map(pair => ({
    id: pair.id,
    label: pair.label,
    result: checkContrast(
      colors[pair.background] ?? '#000000',
      colors[pair.foreground] ?? '#FFFFFF'
    ),
  }));

export { headerContrastChecks };
