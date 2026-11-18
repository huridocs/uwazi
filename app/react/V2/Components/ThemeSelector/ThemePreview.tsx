import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { UwaziLoader } from '#V2/Components/UI/UwaziLoader.js';
import { getScopedThemeVars } from '#V2/theme/themeScopedVars.js';
import { checkContrast, getContrastTextColor } from '#shared/utils/contrast.js';
import {
  ACCENT_PRIMARY_KEY,
  appliedTheme,
  getChromeStyleOverrides,
  getPresetId,
  mergeScopedThemeAndChrome,
  type ResolvedThemeVars,
  type ThemeMode,
} from '#V2/theme/themes.js';
import { ThemePreviewLogo } from './ThemePreviewLogo.js';
import {
  elementFromEventTarget,
  tokenForPaintedColor,
  tokenFromPreviewClick,
} from './themeTokenFocus.js';

type ThemeVars = Record<string, string | undefined>;

type ThemePreviewProps = {
  mode: ThemeMode;
  themeVars: ThemeVars;
  siteLogo?: string | undefined;
  siteName?: string;
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
  return {
    accent,
    surfaceBg,
    primaryText,
    accentText: getContrastTextColor(accent),
    outlineColor: resolveAccessibleText(surfaceBg, accent, primaryText),
  };
};

const previewMenu = ['Home', 'About', 'Contact'] as const;
const previewTools = ['English', 'Library', 'Settings'] as const;

type PaintToken = {
  color: string;
  resolved: ResolvedThemeVars;
  keys: (keyof ResolvedThemeVars)[];
  fallback: string;
};

const paintToken = ({ color, resolved, keys, fallback }: PaintToken) =>
  tokenForPaintedColor(
    color,
    keys.flatMap(token => {
      const value = resolved[token];
      return value ? [{ token, color: value }] : [];
    })
  ) ?? fallback;

const previewToolClass =
  'header-bar-button flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium';

const ThemePreview = ({ mode, themeVars, siteLogo, siteName }: ThemePreviewProps) => {
  const resolved = appliedTheme(themeVars, mode, true);
  const presetId = getPresetId(themeVars, true);
  const colors = previewTextColors(resolved);
  const secondaryTextToken = paintToken({
    color: colors.outlineColor,
    resolved,
    keys: [
      '--color-theme-text-primary',
      '--color-theme-text-secondary',
      '--color-theme-text-tertiary',
      '--color-theme-text-muted',
      '--color-theme-accent-primary',
    ],
    fallback: '--color-theme-accent-primary',
  });
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
      onClick={event => {
        const node = elementFromEventTarget(event.target);
        if (!node) return;
        const token = tokenFromPreviewClick(node, event.clientX, event.clientY);
        if (!token) return;
        document.dispatchEvent(new CustomEvent('uwazi-theme-token', { detail: token }));
      }}
      style={{
        ...style,
        borderColor: 'color-mix(in srgb, var(--color-theme-border-default) 70%, transparent)',
      }}
    >
      <div
        className="header-bar relative flex min-h-13 w-full flex-col"
        data-uwazi-header
        data-theme-token="--color-theme-chrome-app-bar"
      >
        <div className="relative flex h-full min-h-13 flex-1 items-center justify-between gap-3 px-3">
          <div className="flex min-w-0 shrink items-center gap-3">
            {siteLogo ? (
              <ThemePreviewLogo siteLogo={siteLogo} />
            ) : (
              <div className="min-w-0" data-theme-token="--color-theme-chrome-app-bar-fg">
                <p className="header-bar-brand truncate text-xs font-semibold">{siteName}</p>
                <p className="truncate text-[0.6875rem]" style={{ color: headerFg }}>
                  <Translate>Header and button preview</Translate>
                </p>
              </div>
            )}
            <div className="flex min-w-0 items-center gap-1.5">
              {previewMenu.map(label => (
                <span
                  key={label}
                  data-theme-token={
                    label === 'Home'
                      ? '--color-theme-chrome-app-bar-active'
                      : '--color-theme-chrome-app-bar-hover'
                  }
                  className={`${previewToolClass} ${label === 'Home' ? 'header-bar-button-active' : ''}`}
                >
                  <Translate>{label}</Translate>
                </span>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-warm"
              data-theme-token="--color-theme-bg-surface"
            >
              <span data-theme-token="--color-theme-accent-supporting">
                <UwaziLoader size="xs" color="carbon" />
              </span>
            </span>
            {previewTools.map(label => (
              <span
                key={label}
                className={previewToolClass}
                data-theme-token="--color-theme-chrome-app-bar-hover"
              >
                <Translate>{label}</Translate>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        className="p-4"
        data-theme-token="--color-theme-bg-primary"
        style={{ backgroundColor: 'var(--color-theme-bg-primary)' }}
      >
        <div
          className="rounded-xl border p-4"
          data-theme-token="--color-theme-bg-surface"
          data-theme-edge="--color-theme-border-primary"
          style={{
            backgroundColor: 'var(--color-theme-bg-surface)',
            borderColor: 'var(--color-theme-border-primary)',
          }}
        >
          <p
            className="text-xs font-semibold"
            data-theme-token="--color-theme-text-primary"
            style={{ color: colors.primaryText }}
          >
            <Translate>Theme preview</Translate>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border px-2.5 py-1.5 text-[0.6875rem] font-medium"
              data-theme-token="--color-theme-accent-primary"
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
              className="rounded-lg border px-2.5 py-1.5 text-[0.6875rem] font-medium"
              data-theme-token="--color-theme-bg-surface"
              data-theme-text={secondaryTextToken}
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
      </div>
    </div>
  );
};

export { ThemePreview };
