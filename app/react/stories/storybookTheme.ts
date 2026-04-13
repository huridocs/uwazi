import type { CSSProperties } from 'react';
import {
  getActionThemeVars,
  getBannerThemeVars,
  getButtonThemeVars,
  getCardThemeVars,
  getDerivedThemeVars,
} from '#V2/theme/ThemeProvider.js';
import { checkContrast } from '#shared/utils/contrast.js';
import {
  ACCENT_PRIMARY_KEY,
  appliedTheme,
  getPresetVars,
  toCompatibilityVars,
  type ThemeMode,
  type ThemePresetId,
} from '#V2/theme/themes.js';

const STORYBOOK_THEME_PRESETS = ['default', 'legacy'] as const;

type StorybookThemePreset = (typeof STORYBOOK_THEME_PRESETS)[number];

type StorybookContrastCheck = {
  id: string;
  label: string;
  ratio: number;
  passesAA: boolean;
};

const buildStorybookThemeVars = (preset: StorybookThemePreset): Record<string, string> =>
  getPresetVars(preset);

const getStorybookThemeFrame = (preset: StorybookThemePreset, mode: ThemeMode) => {
  const themeVars = buildStorybookThemeVars(preset);
  const resolved = appliedTheme(themeVars, mode, true);
  const accent = resolved[ACCENT_PRIMARY_KEY] ?? '#1A1A1A';

  return {
    themeVars,
    className: ['tw-content', mode === 'dark' ? 'dark' : ''].filter(Boolean).join(' '),
    style: {
      colorScheme: mode,
      ...resolved,
      ...toCompatibilityVars(resolved),
      ...getDerivedThemeVars(accent),
      ...getActionThemeVars(resolved),
      ...getBannerThemeVars(preset, resolved),
      ...getButtonThemeVars(preset, resolved),
      ...getCardThemeVars(preset, resolved),
    } as CSSProperties & Record<string, string>,
  };
};

const getStorybookContrastChecks = (
  preset: StorybookThemePreset,
  mode: ThemeMode
): StorybookContrastCheck[] => {
  const resolved = appliedTheme(buildStorybookThemeVars(preset), mode, true);
  const buttons = getButtonThemeVars(preset, resolved);
  const resolveButtonBackground = (value: string) =>
    value === 'transparent' ? resolved['--color-theme-bg-surface'] : value;

  return [
    {
      id: 'surface-primary',
      label: 'Surface text',
      ...checkContrast(
        resolved['--color-theme-bg-surface'],
        resolved['--color-theme-text-primary']
      ),
    },
    {
      id: 'surface-secondary',
      label: 'Secondary text',
      ...checkContrast(
        resolved['--color-theme-bg-surface'],
        resolved['--color-theme-text-secondary']
      ),
    },
    {
      id: 'primary-solid-button',
      label: 'Primary solid button',
      ...checkContrast(
        buttons['--color-theme-button-primary-bg'],
        buttons['--color-theme-button-primary-fg']
      ),
    },
    {
      id: 'error-solid-button',
      label: 'Error solid button',
      ...checkContrast(
        buttons['--color-theme-button-danger-bg'],
        buttons['--color-theme-button-danger-fg']
      ),
    },
    {
      id: 'success-solid-button',
      label: 'Success solid button',
      ...checkContrast(
        buttons['--color-theme-button-success-bg'],
        buttons['--color-theme-button-success-fg']
      ),
    },
    {
      id: 'secondary-button-text',
      label: 'Secondary button text',
      ...checkContrast(
        resolveButtonBackground(buttons['--color-theme-button-secondary-bg']),
        buttons['--color-theme-button-secondary-fg']
      ),
    },
    {
      id: 'compact-button-text',
      label: 'Compact button text',
      ...checkContrast(
        buttons['--color-theme-button-compact-bg'],
        buttons['--color-theme-button-compact-fg']
      ),
    },
    {
      id: 'danger-secondary-button',
      label: 'Danger secondary button',
      ...checkContrast(
        resolveButtonBackground(buttons['--color-theme-button-danger-secondary-bg']),
        buttons['--color-theme-button-danger-secondary-fg']
      ),
    },
    {
      id: 'success-secondary-button',
      label: 'Success secondary button',
      ...checkContrast(
        resolveButtonBackground(buttons['--color-theme-button-success-secondary-bg']),
        buttons['--color-theme-button-success-secondary-fg']
      ),
    },
    {
      id: 'danger-subtle-button',
      label: 'Danger subtle button',
      ...checkContrast(
        buttons['--color-theme-button-danger-subtle-bg'],
        buttons['--color-theme-button-danger-subtle-fg']
      ),
    },
    {
      id: 'success-subtle-button',
      label: 'Success subtle button',
      ...checkContrast(
        buttons['--color-theme-button-success-subtle-bg'],
        buttons['--color-theme-button-success-subtle-fg']
      ),
    },
  ];
};

const normalizeStorybookThemePreset = (preset: unknown): StorybookThemePreset =>
  preset === 'legacy' ? 'legacy' : 'default';

const normalizeStorybookThemeMode = (mode: unknown): ThemeMode =>
  mode === 'dark' ? 'dark' : 'light';

export {
  STORYBOOK_THEME_PRESETS,
  buildStorybookThemeVars,
  getStorybookContrastChecks,
  getStorybookThemeFrame,
  normalizeStorybookThemeMode,
  normalizeStorybookThemePreset,
};
export type { StorybookContrastCheck, StorybookThemePreset, ThemeMode, ThemePresetId };
