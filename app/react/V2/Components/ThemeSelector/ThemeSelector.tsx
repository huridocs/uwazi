import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { ColorPicker } from '#V2/Components/Forms/ColorPicker.js';
import { Button } from '#V2/Components/UI/index.js';
import { getDerivedThemeVars } from '#V2/theme/ThemeProvider.js';
import { checkContrast, getContrastTextColor } from '#shared/utils/contrast.js';
import {
  ACCENT_PRIMARY_KEY,
  appliedTheme,
  getCustomThemeVars,
  getThemeAsset,
  getThemeAssetPresetId,
  getPresetId,
  getPresetVars,
  isValidHex,
  NAMED_THEMES,
  SEMANTIC_VAR_KEYS,
  SEMANTIC_VAR_LABELS,
  THEME_PALETTE,
  THEME_MODES,
  themeStorageKey,
  toCanonicalThemeVars,
  toCompatibilityVars,
  type SemanticVarKey,
  type ThemeAssets,
  type ThemeMode,
} from '#V2/theme/themes.js';

type ThemeSelectorProps = {
  value: Record<string, string | undefined>;
  onChange: (value: Record<string, string | undefined>) => void;
  themeAssets?: ThemeAssets;
  onThemeAssetsChange?: (value: ThemeAssets) => void;
  siteLogo?: string | undefined;
  favicon?: string | undefined;
};

type ThemePreviewProps = {
  mode: ThemeMode;
  themeVars: Record<string, string | undefined>;
  siteLogo?: string | undefined;
  favicon?: string | undefined;
};

const modeButtonClass = (selected: boolean) =>
  [
    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
    selected ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  ].join(' ');

const resolveAccessibleText = (background: string, preferred: string, fallback: string) =>
  checkContrast(background, preferred).passesAA ? preferred : fallback;

const contrastChecks = (themeVars: Record<string, string | undefined>, mode: ThemeMode) => {
  const resolved = appliedTheme(themeVars, mode, true);
  const accent = resolved[ACCENT_PRIMARY_KEY];
  const surface = resolved['--color-theme-bg-surface'];
  const primaryText = resolved['--color-theme-text-primary'];
  const outlineColor = accent;
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
      result: checkContrast(surface, outlineColor),
    },
    {
      id: 'outline-button-border',
      label: 'Secondary button border',
      result: checkContrast(surface, outlineColor),
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

const ThemePreview = ({ mode, themeVars, siteLogo, favicon }: ThemePreviewProps) => {
  const resolved = appliedTheme(themeVars, mode, true);
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
  const accentText = getContrastTextColor(accent);
  const outlineColor = resolveAccessibleText(surfaceBg, accent, primaryText);
  const style: React.CSSProperties & Record<string, string> = {
    colorScheme: mode,
    ...resolved,
    ...toCompatibilityVars(resolved),
    ...getDerivedThemeVars(accent),
  };

  return (
    <div
      className={['tw-content overflow-hidden rounded-xl border border-gray-200 shadow-sm', mode === 'dark' ? 'dark' : '']
        .filter(Boolean)
        .join(' ')}
      data-theme-custom
      style={style}
    >
      <div
        className="flex items-center justify-between gap-3 border-b px-4 py-3"
        style={{
          backgroundColor: 'var(--color-theme-bg-surface)',
          borderColor: 'var(--color-theme-border-primary)',
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          {siteLogo ? (
            <img src={siteLogo} alt="" className="logo-img h-7 max-w-[7.5rem] object-contain" />
          ) : (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold"
              style={{
                backgroundColor: 'var(--color-theme-bg-muted)',
                color: primaryText,
              }}
            >
              U
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: primaryText }}>
              Uwazi
            </p>
            <p className="truncate text-xs" style={{ color: secondaryText }}>
              Header and button preview
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {favicon ? <img src={favicon} alt="" className="h-5 w-5 rounded object-contain" /> : null}
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-[0.8125rem] font-medium"
            style={{
              borderColor: 'var(--color-theme-border-soft)',
              color: secondaryText,
            }}
          >
            Library
          </button>
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-[0.8125rem] font-medium"
            style={{
              borderColor: 'var(--color-theme-border-soft)',
              color: secondaryText,
            }}
          >
            Settings
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
          <p className="text-sm font-semibold" style={{ color: primaryText }}>
            Theme preview
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border px-3 py-2 text-xs font-medium"
              style={{
                backgroundColor: accent,
                borderColor: accent,
                color: accentText,
              }}
            >
              <Translate>Primary button</Translate>
            </button>
            <button
              type="button"
              className="rounded-lg border px-3 py-2 text-xs font-medium"
              style={{
                backgroundColor: surfaceBg,
                borderColor: outlineColor,
                color: outlineColor,
              }}
            >
              <Translate>Secondary button</Translate>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {THEME_PALETTE.filter(entry => entry.id.startsWith('accent-')).map(entry => (
            <div key={entry.id} className="rounded-lg border border-gray-200 p-2">
              <div className="h-10 rounded-md" style={{ backgroundColor: `var(${entry.semanticKey})` }} />
              <p className="mt-2 truncate text-xs font-medium" style={{ color: primaryText }}>
                {SEMANTIC_VAR_LABELS[entry.semanticKey]}
              </p>
              <p className="truncate text-[0.6875rem]" style={{ color: secondaryText }} title={entry.semanticKey}>
                {entry.semanticKey}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PresetCard = ({
  title,
  lightAccent,
  darkAccent,
  selected,
  onClick,
}: {
  title: string;
  lightAccent: string;
  darkAccent: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    className={`flex min-w-[10rem] flex-1 flex-col gap-3 rounded-xl border p-3 text-left transition-all ${
      selected ? 'border-primary-600 ring-2 ring-primary-500/20' : 'border-gray-200 hover:border-gray-300'
    }`}
    onClick={onClick}
  >
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="grid grid-cols-2">
        <div className="space-y-2 p-2" style={{ backgroundColor: '#ffffff' }}>
          <div className="h-2 w-12 rounded-sm bg-black/20" />
          <div className="h-8 rounded-md border" style={{ borderColor: lightAccent, backgroundColor: '#ffffff' }} />
          <div className="h-6 rounded-md" style={{ backgroundColor: lightAccent }} />
        </div>
        <div className="space-y-2 p-2" style={{ backgroundColor: '#242424' }}>
          <div className="h-2 w-12 rounded-sm bg-white/20" />
          <div className="h-8 rounded-md border" style={{ borderColor: darkAccent, backgroundColor: '#242424' }} />
          <div className="h-6 rounded-md" style={{ backgroundColor: darkAccent }} />
        </div>
      </div>
    </div>
    <div className="text-sm font-medium text-gray-900">{title}</div>
  </button>
);

export const ThemeSelector = ({
  value,
  onChange,
  themeAssets,
  onThemeAssetsChange,
  siteLogo,
  favicon,
}: ThemeSelectorProps) => {
  const themeVars = React.useMemo(() => toCanonicalThemeVars(value), [value]);
  const selectedPreset = getPresetId(themeVars, true);
  const [previewMode, setPreviewMode] = React.useState<ThemeMode>('light');
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const previewLogo = getThemeAsset(themeAssets, themeVars, previewMode, 'siteLogo', siteLogo);
  const previewFavicon = getThemeAsset(themeAssets, themeVars, previewMode, 'favicon', favicon);
  const failedChecks = contrastChecks(themeVars, previewMode).filter(check => !check.result.passesAA);
  const colorOptions = React.useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...NAMED_THEMES.flatMap(theme =>
              THEME_MODES.flatMap(mode => SEMANTIC_VAR_KEYS.map(key => theme.modes[mode][key]))
            ),
            ...THEME_MODES.flatMap(mode =>
              SEMANTIC_VAR_KEYS.map(key => appliedTheme(themeVars, mode, true)[key])
            ),
          ].filter(isValidHex)
        )
      ),
    [themeVars]
  );

  const update = (key: string, nextValue: string | undefined) => {
    const next = { ...themeVars };
    if (nextValue === undefined || nextValue === '') delete next[key];
    else next[key] = nextValue;
    onChange(next);
  };

  const updateModeVar = (mode: ThemeMode, key: SemanticVarKey, nextValue: string | undefined) => {
    update(themeStorageKey(mode, key), nextValue);
  };

  return (
    <div className="flex flex-col gap-6">
      <section>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          <Translate>Theme presets</Translate>
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          {NAMED_THEMES.map(theme => {
            const lightAccent =
              theme.id === 'custom'
                ? appliedTheme(themeVars, 'light', true)[ACCENT_PRIMARY_KEY]
                : theme.modes.light[ACCENT_PRIMARY_KEY];
            const darkAccent =
              theme.id === 'custom'
                ? appliedTheme(themeVars, 'dark', true)[ACCENT_PRIMARY_KEY]
                : theme.modes.dark[ACCENT_PRIMARY_KEY];
            const selected = selectedPreset === theme.id;
            return (
              <PresetCard
                key={theme.id}
                title={theme.label}
                lightAccent={lightAccent}
                darkAccent={darkAccent}
                selected={selected}
                onClick={() =>
                  {
                    onChange(
                      theme.id === 'custom' ? getCustomThemeVars(themeVars, true) : getPresetVars(theme.id)
                    );
                    if (theme.id === 'default' || theme.id === 'legacy') {
                      onThemeAssetsChange?.({
                        ...themeAssets,
                        preset: theme.id,
                      });
                    }
                    if (theme.id === 'custom') {
                      onThemeAssetsChange?.({
                        ...themeAssets,
                        preset: getThemeAssetPresetId(themeAssets, themeVars, true),
                      });
                    }
                  }
                }
              />
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-700">
            <Translate>Live preview</Translate>
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-1">
            {THEME_MODES.map(mode => (
              <button
                key={mode}
                type="button"
                className={modeButtonClass(previewMode === mode)}
                onClick={() => setPreviewMode(mode)}
              >
                {mode === 'light' ? <Translate>Light</Translate> : <Translate>Dark</Translate>}
              </button>
            ))}
          </div>
        </div>
        {failedChecks.length ? (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-medium text-amber-800">
              <Translate>Accessibility checks need attention</Translate>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {failedChecks.map(check => (
                <span
                  key={check.id}
                  className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200"
                >
                  {check.label} {check.result.ratio.toFixed(1)}:1
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <ThemePreview
          mode={previewMode}
          themeVars={themeVars}
          siteLogo={previewLogo}
          favicon={previewFavicon}
        />
      </section>

      <section className="rounded-xl border border-gray-200">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          onClick={() => setShowAdvanced(current => !current)}
        >
          <p className="text-sm font-medium text-gray-700">
            <Translate>Advanced colors</Translate>
          </p>
          <span className="text-xs font-medium text-primary-700">
            {showAdvanced ? <Translate>Hide</Translate> : <Translate>Customize</Translate>}
          </span>
        </button>

        {showAdvanced ? (
          <div className="border-t border-gray-200 px-4 py-4">
            <div className="space-y-3">
              {SEMANTIC_VAR_KEYS.map(key => {
                const storageKey = themeStorageKey(previewMode, key);
                const resolved = appliedTheme(themeVars, previewMode, true);
                const override = themeVars[storageKey];
                const displayValue = resolved[key] ?? '#000000';

                return (
                  <div
                    key={`${previewMode}-${key}`}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 p-3"
                  >
                    <div className="min-w-0 grow">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {SEMANTIC_VAR_LABELS[key] ?? key}
                      </p>
                      <p className="text-xs text-gray-500">{displayValue}</p>
                    </div>

                    <ColorPicker
                      name={`${previewMode}-${key}`}
                      value={displayValue}
                      options={colorOptions}
                      onChange={color => updateModeVar(previewMode, key, color)}
                    />

                    <Button
                      type="button"
                      size="small"
                      styling="light"
                      onClick={() => updateModeVar(previewMode, key, undefined)}
                      disabled={!override}
                    >
                      <Translate>Reset</Translate>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};
