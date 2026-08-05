import type { CSSProperties } from 'react';
import { getScopedThemeVars } from '#V2/theme/themeScopedVars.js';
import { checkContrast } from '#shared/utils/contrast.js';
import {
  appliedTheme,
  getPresetVars,
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

  return {
    themeVars,
    className: ['tw-content', mode === 'dark' ? 'dark' : ''].filter(Boolean).join(' '),
    style: {
      colorScheme: mode,
      ...getScopedThemeVars(preset, resolved),
    } as CSSProperties & Record<string, string>,
  };
};

const getStorybookContrastChecks = (
  preset: StorybookThemePreset,
  mode: ThemeMode
): StorybookContrastCheck[] => {
  const resolved = appliedTheme(buildStorybookThemeVars(preset), mode, true);
  const scoped = getScopedThemeVars(preset, resolved);

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
        scoped['--color-theme-action-primary'],
        scoped['--color-theme-action-primary-fg']
      ),
    },
    {
      id: 'error-solid-button',
      label: 'Error solid button',
      ...checkContrast(
        resolved['--color-theme-accent-emphasis'],
        resolved['--color-theme-feedback-danger-fg']
      ),
    },
    {
      id: 'success-solid-button',
      label: 'Success solid button',
      ...checkContrast(
        resolved['--color-theme-success'],
        resolved['--color-theme-feedback-success-fg']
      ),
    },
    {
      id: 'secondary-button-text',
      label: 'Secondary button text',
      ...checkContrast(
        resolved['--color-theme-bg-surface'],
        resolved['--color-theme-text-secondary']
      ),
    },
    {
      id: 'compact-button-text',
      label: 'Compact button text',
      ...checkContrast(resolved['--color-theme-bg-warm'], resolved['--color-theme-text-secondary']),
    },
    {
      id: 'danger-secondary-button',
      label: 'Danger secondary button',
      ...checkContrast(
        resolved['--color-theme-bg-surface'],
        resolved['--color-theme-accent-emphasis']
      ),
    },
    {
      id: 'success-secondary-button',
      label: 'Success secondary button',
      ...checkContrast(resolved['--color-theme-bg-surface'], resolved['--color-theme-success']),
    },
    {
      id: 'danger-subtle-button',
      label: 'Danger subtle button',
      ...checkContrast(
        resolved['--color-theme-accent-emphasis-tint'],
        resolved['--color-theme-accent-emphasis']
      ),
    },
    {
      id: 'success-subtle-button',
      label: 'Success subtle button',
      ...checkContrast(resolved['--color-theme-success-light'], resolved['--color-theme-success']),
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
