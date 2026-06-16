import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { SectionHeading, SegmentedControl, SurfacePanel } from '#V2/Components/UI/index.js';
import { checkContrast, getContrastTextColor } from '#shared/utils/contrast.js';
import { ACCENT_PRIMARY_KEY, appliedTheme, THEME_MODES } from '#V2/theme/themes.js';
import type { ThemeMode } from '#V2/theme/themes.js';
import { ThemePreview } from './ThemePreview.js';

type ThemeVars = Record<string, string | undefined>;

type ThemePreviewSectionProps = {
  previewMode: ThemeMode;
  setPreviewMode: (mode: ThemeMode) => void;
  themeVars: ThemeVars;
  siteLogo?: string | undefined;
  favicon?: string | undefined;
};

const contrastChecks = (themeVars: ThemeVars, mode: ThemeMode) => {
  const resolved = appliedTheme(themeVars, mode, true);
  const accent = resolved[ACCENT_PRIMARY_KEY];
  const surface = resolved['--color-theme-bg-surface'];
  const primaryText = resolved['--color-theme-text-primary'];

  return [
    {
      id: 'surface-primary',
      label: 'Surface text',
      result: checkContrast(surface, primaryText),
    },
    {
      id: 'surface-secondary',
      label: 'Secondary text',
      result: checkContrast(surface, resolved['--color-theme-text-secondary']),
    },
    {
      id: 'accent-primary',
      label: 'Primary action',
      result: checkContrast(accent, getContrastTextColor(accent)),
    },
    {
      id: 'outline-button-text',
      label: 'Secondary button text',
      result: checkContrast(surface, accent),
    },
    {
      id: 'outline-button-border',
      label: 'Secondary button border',
      result: checkContrast(surface, accent),
    },
    {
      id: 'preview-brand-label',
      label: 'Uwazi label',
      result: checkContrast(surface, primaryText),
    },
    {
      id: 'preview-title-label',
      label: 'Theme preview label',
      result: checkContrast(surface, primaryText),
    },
  ];
};

const ThemePreviewSection = ({
  previewMode,
  setPreviewMode,
  themeVars,
  siteLogo,
  favicon,
}: ThemePreviewSectionProps) => {
  const failedChecks = contrastChecks(themeVars, previewMode).filter(
    check => !check.result.passesAA
  );

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <SectionHeading>
          <Translate>Live preview</Translate>
        </SectionHeading>
        <SegmentedControl
          value={previewMode}
          onChange={setPreviewMode}
          ariaLabel="Preview mode"
          showLabels
          options={THEME_MODES.map(mode => ({
            id: mode,
            title: mode,
            label: mode === 'light' ? <Translate>Light</Translate> : <Translate>Dark</Translate>,
          }))}
        />
      </div>
      {failedChecks.length ? (
        <SurfacePanel
          tone="warm"
          className="mb-3 border-warning-light bg-warning-light px-4 py-3 shadow-none"
        >
          <p className="text-xs font-medium text-amber-800">
            <Translate>Accessibility checks need attention</Translate>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {failedChecks.map(check => (
              <span
                key={check.id}
                className="rounded-full px-2.5 py-1 text-xs font-medium ring-1"
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
      ) : null}
      <ThemePreview
        mode={previewMode}
        themeVars={themeVars}
        siteLogo={siteLogo}
        favicon={favicon}
      />
    </section>
  );
};

export { ThemePreviewSection };
