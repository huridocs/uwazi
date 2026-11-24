import React from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { SurfacePanel } from '#V2/Components/UI/index.js';
import { checkContrast, getContrastTextColor } from '#shared/utils/contrast.js';
import { headerContrastChecks } from '#V2/theme/headerContrast.js';
import { getScopedThemeVars } from '#V2/theme/themeScopedVars.js';
import {
  ACCENT_PRIMARY_KEY,
  appliedTheme,
  getChromeStyleOverrides,
  getPresetId,
  mergeScopedThemeAndChrome,
} from '#V2/theme/themes.js';
import type { ThemeMode } from '#V2/theme/themes.js';

type ThemeVars = Record<string, string | undefined>;

type ThemePreviewSectionProps = {
  previewMode: ThemeMode;
  themeVars: ThemeVars;
};

const contrastChecks = (themeVars: ThemeVars, mode: ThemeMode) => {
  const resolved = appliedTheme(themeVars, mode, true);
  const merged = mergeScopedThemeAndChrome(
    getScopedThemeVars(getPresetId(themeVars, true), resolved),
    getChromeStyleOverrides(themeVars, mode),
    resolved
  );
  const accent = resolved[ACCENT_PRIMARY_KEY];
  const surface = resolved['--color-theme-bg-surface'];
  const primaryText = resolved['--color-theme-text-primary'];

  return [
    ...headerContrastChecks(merged).map(check => ({
      ...check,
      label: t('System', check.label, null, false),
    })),
    {
      id: 'surface-primary',
      label: t('System', 'Surface text', null, false),
      result: checkContrast(surface, primaryText),
    },
    {
      id: 'surface-secondary',
      label: t('System', 'Secondary text', null, false),
      result: checkContrast(surface, resolved['--color-theme-text-secondary']),
    },
    {
      id: 'accent-primary',
      label: t('System', 'Primary action', null, false),
      result: checkContrast(accent, getContrastTextColor(accent)),
    },
    {
      id: 'outline-button-text',
      label: t('System', 'Secondary button text', null, false),
      result: checkContrast(surface, accent),
    },
    {
      id: 'outline-button-border',
      label: t('System', 'Secondary button border', null, false),
      result: checkContrast(surface, accent),
    },
    {
      id: 'preview-brand-label',
      label: t('System', 'Uwazi label', null, false),
      result: checkContrast(surface, primaryText),
    },
    {
      id: 'preview-title-label',
      label: t('System', 'Theme preview label', null, false),
      result: checkContrast(surface, primaryText),
    },
  ];
};

const ThemePreviewSection = ({ previewMode, themeVars }: ThemePreviewSectionProps) => {
  const failedChecks = contrastChecks(themeVars, previewMode).filter(
    check => !check.result.passesAA
  );
  if (!failedChecks.length) return null;

  return (
    <SurfacePanel
      tone="warm"
      className="sticky top-0 z-20 border-warning-light bg-warning-light px-4 py-3 shadow-none"
    >
      <p className="text-xs font-medium text-amber-800">
        <Translate>Accessibility checks need attention</Translate>
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {failedChecks.map(check => (
          <span
            key={check.id}
            className="whitespace-nowrap rounded-full px-2 py-0.5 text-[0.6875rem] font-medium ring-1"
            style={{
              backgroundColor: 'var(--color-theme-surface-raised)',
              color: 'var(--color-theme-warning)',
              boxShadow:
                'inset 0 0 0 1px color-mix(in srgb, var(--color-theme-warning) 25%, transparent)',
            }}
          >
            {check.label} {check.result.ratio.toFixed(1)}:1
          </span>
        ))}
      </div>
    </SurfacePanel>
  );
};

export { ThemePreviewSection };
