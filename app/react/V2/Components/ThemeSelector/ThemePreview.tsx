import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { getScopedThemeVars } from '#V2/theme/themeScopedVars.js';
import { checkContrast, getContrastTextColor } from '#shared/utils/contrast.js';
import {
  ACCENT_PRIMARY_KEY,
  appliedTheme,
  getChromeStyleOverrides,
  getPresetId,
  mergeScopedThemeAndChrome,
  SEMANTIC_VAR_LABELS,
  THEME_PALETTE,
  type ResolvedThemeVars,
  type ThemeMode,
} from '#V2/theme/themes.js';
import { ThemePreviewLogo } from './ThemePreviewLogo.js';

type ThemeVars = Record<string, string | undefined>;

type ThemePreviewProps = {
  mode: ThemeMode;
  themeVars: ThemeVars;
  siteLogo?: string | undefined;
  favicon?: string | undefined;
};

const resolveAccessibleText = (background: string, preferred: string, fallback: string) =>
  checkContrast(background, preferred).passesAA ? preferred : fallback;

const previewTextColors = (resolved: ResolvedThemeVars) => {
  const accent = resolved[ACCENT_PRIMARY_KEY] ?? '#1A1A1A';
  const surfaceBg = resolved['--color-theme-bg-surface'];
  const primaryText = resolveAccessibleText(
    surfaceBg,
    resolved['--color-theme-text-primary'],
    getContrastTextColor(surfaceBg)
  );
  const secondaryText = resolveAccessibleText(
    surfaceBg,
    resolved['--color-theme-text-secondary'],
    primaryText
  );
  return {
    accent,
    surfaceBg,
    primaryText,
    secondaryText,
    accentText: getContrastTextColor(accent),
    outlineColor: resolveAccessibleText(surfaceBg, accent, primaryText),
  };
};

const ThemePreview = ({ mode, themeVars, siteLogo, favicon }: ThemePreviewProps) => {
  const resolved = appliedTheme(themeVars, mode, true);
  const presetId = getPresetId(themeVars, true);
  const colors = previewTextColors(resolved);
  const chromeStyle = getChromeStyleOverrides(themeVars, mode);
  const style: React.CSSProperties & Record<string, string> = {
    colorScheme: mode,
    ...mergeScopedThemeAndChrome(getScopedThemeVars(presetId, resolved), chromeStyle, resolved),
  };
  const headerFg = 'var(--color-theme-chrome-app-bar-fg)';

  return (
    <div
      className={[
        'tw-content overflow-hidden rounded-xl border shadow-sm',
        mode === 'dark' ? 'dark' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-theme-custom
      style={{
        ...style,
        borderColor: 'color-mix(in srgb, var(--color-theme-border-default) 70%, transparent)',
      }}
    >
      <div
        className="flex min-h-13 items-center justify-between gap-3 border-b px-3"
        style={{
          backgroundColor: 'var(--color-theme-chrome-app-bar)',
          borderColor: 'var(--color-theme-chrome-app-bar-separator)',
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          {siteLogo ? (
            <ThemePreviewLogo siteLogo={siteLogo} />
          ) : (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold"
              style={{
                backgroundColor: 'var(--color-theme-chrome-app-bar-active)',
                color: headerFg,
              }}
            >
              <Translate>Uwazi</Translate>
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: headerFg }}>
              <Translate>Uwazi</Translate>
            </p>
            <p className="truncate text-xs" style={{ color: headerFg }}>
              <Translate>Header and button preview</Translate>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {favicon ? <img src={favicon} alt="" className="h-5 w-5 rounded object-contain" /> : null}
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-tab font-medium"
            style={{
              borderColor: 'var(--color-theme-chrome-app-bar-separator)',
              color: headerFg,
            }}
          >
            <Translate>Library</Translate>
          </button>
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-tab font-medium"
            style={{
              borderColor: 'var(--color-theme-chrome-app-bar-separator)',
              color: headerFg,
            }}
          >
            <Translate>Settings</Translate>
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4" style={{ backgroundColor: 'var(--color-theme-bg-primary)' }}>
        <div
          className="rounded-xl border p-4"
          style={{
            backgroundColor: 'var(--color-theme-bg-surface)',
            borderColor: 'var(--color-theme-border-primary)',
          }}
        >
          <p className="text-sm font-semibold" style={{ color: colors.primaryText }}>
            <Translate>Theme preview</Translate>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border px-3 py-2 text-xs font-medium"
              style={{
                backgroundColor: colors.accent,
                borderColor: colors.accent,
                color: colors.accentText,
              }}
            >
              <Translate>Primary button</Translate>
            </button>
            <button
              type="button"
              className="rounded-lg border px-3 py-2 text-xs font-medium"
              style={{
                backgroundColor: colors.surfaceBg,
                borderColor: colors.outlineColor,
                color: colors.outlineColor,
              }}
            >
              <Translate>Secondary button</Translate>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {THEME_PALETTE.filter(entry => entry.id.startsWith('accent-')).map(entry => (
            <div
              key={entry.id}
              className="rounded-lg border p-2"
              style={{
                borderColor:
                  'color-mix(in srgb, var(--color-theme-border-default) 70%, transparent)',
              }}
            >
              <div
                className="h-10 rounded-md"
                style={{ backgroundColor: `var(${entry.semanticKey})` }}
              />
              <p
                className="mt-2 truncate text-xs font-medium"
                style={{ color: colors.primaryText }}
              >
                {SEMANTIC_VAR_LABELS[entry.semanticKey]}
              </p>
              <p
                className="truncate text-[0.6875rem]"
                style={{ color: colors.secondaryText }}
                title={entry.semanticKey}
              >
                {entry.semanticKey}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { ThemePreview };
