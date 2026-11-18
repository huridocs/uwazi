import {
  appliedTheme,
  getChromeStyleOverrides,
  getPresetId,
  mergeScopedThemeAndChrome,
  type ThemeAssetPresetId,
} from './themes.js';
import { getScopedThemeVars } from './themeScopedVars.js';
import { CHROME_VAR_HINTS } from './themeChromeOverrides.js';
import { SEMANTIC_VAR_HINTS } from './tokens.js';
import type { ThemeMode } from './tokens.js';
import { themeVarsForInstanceExport } from './themePresetBackup.js';
import { THEME_SIMPLE_BASE_KEY } from './themeSimpleDerivation.js';

type ThemeVars = Record<string, string | undefined>;

const GROUPS = [
  {
    name: 'header',
    keys: [
      '--color-theme-chrome-app-bar',
      '--color-theme-chrome-app-bar-fg',
      '--color-theme-chrome-app-bar-hover',
      '--color-theme-chrome-app-bar-active',
      '--color-theme-chrome-app-bar-separator',
    ],
  },
  {
    name: 'actions',
    keys: [
      '--color-theme-accent-primary',
      '--color-theme-accent-supporting',
      '--color-theme-accent-emphasis',
      '--color-theme-success',
      '--color-theme-warning',
    ],
  },
  {
    name: 'page',
    keys: [
      '--color-theme-bg-primary',
      '--color-theme-bg-surface',
      '--color-theme-bg-muted',
      '--color-theme-border-primary',
    ],
  },
  {
    name: 'text',
    keys: [
      '--color-theme-text-primary',
      '--color-theme-text-secondary',
      '--color-theme-text-tertiary',
      '--color-theme-text-muted',
    ],
  },
  {
    name: 'settings',
    keys: [
      '--color-theme-chrome-settings-rail-bg',
      '--color-theme-chrome-settings-nav-item-active-bg',
    ],
  },
] as const;

const NOTE: Record<string, string> = { ...CHROME_VAR_HINTS, ...SEMANTIC_VAR_HINTS };

const resolvedColors = (themeVars: ThemeVars, mode: ThemeMode) => {
  const resolved = appliedTheme(themeVars, mode, true);
  const scoped = getScopedThemeVars(getPresetId(themeVars, true), resolved);
  const stored = getChromeStyleOverrides(themeVars, mode);
  return mergeScopedThemeAndChrome(scoped, stored, resolved);
};

const themeExportValue = (colors: Record<string, string>, key: string) => colors[key];

const lines = (keys: readonly string[], colors: Record<string, string>, indent: string) => {
  const present = keys.flatMap(key => {
    const value = themeExportValue(colors, key);
    return value ? [{ key, value }] : [];
  });
  return present
    .map(
      (item, index) =>
        `${indent}"${item.key}": "${item.value}"${index === present.length - 1 ? '' : ','} # ${NOTE[item.key] ?? item.key}`
    )
    .join('\n');
};

const groupBlock = (colors: Record<string, string>) =>
  GROUPS.map((group, index) => {
    const comma = index === GROUPS.length - 1 ? '' : ',';
    return `    "${group.name}": {\n${lines(group.keys, colors, '      ')}\n    }${comma}`;
  }).join('\n');

const editorModeOf = (themeVars: ThemeVars) =>
  themeVars.__themeEditorMode === 'advanced' ? 'advanced' : 'simple';

const colorPreset = (value: string | undefined) =>
  value === 'legacy' || value === 'default' ? value : undefined;

const buildThemeInstanceExport = (themeVars: ThemeVars, assetPreset?: ThemeAssetPresetId) => {
  const source = themeVarsForInstanceExport(themeVars);
  const id =
    colorPreset(source[THEME_SIMPLE_BASE_KEY]) ??
    colorPreset(source.__preset) ??
    (assetPreset === 'legacy' ? 'legacy' : 'custom');
  const assetLine = assetPreset ? `,\n  "assetPreset": "${assetPreset}"` : '';
  return `{
  "id": "${id}",
  "editorMode": "${editorModeOf(source)}"${assetLine},
  "light": {
${groupBlock(resolvedColors(source, 'light'))}
  },
  "dark": {
${groupBlock(resolvedColors(source, 'dark'))}
  }
}
`;
};

const downloadThemeInstance = (contents: string) => {
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'theme-instance.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url));
};

export { buildThemeInstanceExport, downloadThemeInstance, themeExportValue };
