import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { ColorPicker } from '#V2/Components/Forms/ColorPicker.js';
import { Button, SurfacePanel } from '#V2/Components/UI/index.js';
import {
  CHROME_VAR_HINTS,
  CHROME_VAR_LABELS,
  colorPaletteFromHex,
  headerPickerColors,
  relatedPickerColors,
  relatedPickerSpec,
  HEADER_CHROME_VAR_KEYS,
  SEMANTIC_VAR_HINTS,
  SEMANTIC_VAR_LABELS,
  SETTINGS_CHROME_VAR_KEYS,
  sortPaletteHexColors,
  themeStorageKey,
} from '#V2/theme/index.js';
import type { ChromeOverrideVarKey, SemanticVarKey, ThemeMode } from '#V2/theme/index.js';

const colorChunks: { title: string; keys: SemanticVarKey[] }[] = [
  {
    title: 'Actions',
    keys: [
      '--color-theme-accent-primary',
      '--color-theme-accent-supporting',
      '--color-theme-accent-emphasis',
      '--color-theme-success',
      '--color-theme-warning',
    ],
  },
  {
    title: 'Page',
    keys: [
      '--color-theme-bg-primary',
      '--color-theme-bg-surface',
      '--color-theme-bg-muted',
      '--color-theme-border-primary',
    ],
  },
  {
    title: 'Text',
    keys: [
      '--color-theme-text-primary',
      '--color-theme-text-secondary',
      '--color-theme-text-tertiary',
      '--color-theme-text-muted',
    ],
  },
];

type ThemeVars = Record<string, string | undefined>;

type ThemeAdvancedColorsSectionProps = {
  previewMode: ThemeMode;
  themeVars: ThemeVars;
  resolvedPreviewTheme: ThemeVars;
  resolvedMergedPreview: Record<string, string>;
  colorOptions: string[];
  updateModeVar: (mode: ThemeMode, key: SemanticVarKey, nextValue: string | undefined) => void;
  updateChromeModeVar: (
    mode: ThemeMode,
    key: ChromeOverrideVarKey,
    nextValue: string | undefined
  ) => void;
};

const pickerOptions = (displayValue: string, colorOptions: string[]) =>
  sortPaletteHexColors([...new Set([...colorPaletteFromHex(displayValue), ...colorOptions])]);

const ThemeAdvancedColorsSection = ({
  previewMode,
  themeVars,
  resolvedPreviewTheme,
  resolvedMergedPreview,
  colorOptions,
  updateModeVar,
  updateChromeModeVar,
}: ThemeAdvancedColorsSectionProps) => {
  const row = ({
    key,
    token,
    colorKey,
    label,
    hint,
    displayValue,
    name,
    onChange,
    onReset,
    resetDisabled,
  }: {
    key: string;
    token?: ChromeOverrideVarKey;
    colorKey?: string;
    label: string;
    hint: string;
    displayValue: string;
    name: string;
    onChange: (color: string) => void;
    onReset: () => void;
    resetDisabled: boolean;
  }) => {
    const barKey = '--color-theme-chrome-app-bar';
    const headerOptions =
      token && token !== barKey
        ? headerPickerColors({
            key: token,
            displayValue,
            colorOptions,
            bar: resolvedMergedPreview[barKey] ?? displayValue,
            text: resolvedMergedPreview['--color-theme-chrome-app-bar-fg'] ?? '#1A1A1A',
          })
        : undefined;
    const spec = relatedPickerSpec(colorKey ?? '', {
      page: resolvedPreviewTheme['--color-theme-bg-primary'] ?? '#FFFFFF',
      surface: resolvedPreviewTheme['--color-theme-bg-surface'] ?? '#FFFFFF',
      text: resolvedPreviewTheme['--color-theme-text-primary'] ?? '#1A1A1A',
      rail: resolvedMergedPreview['--color-theme-chrome-settings-rail-bg'] ?? '#FFFFFF',
    });
    const options =
      headerOptions ??
      (spec
        ? relatedPickerColors({ ...spec, displayValue, colorOptions })
        : pickerOptions(displayValue, colorOptions));
    return (
      <div key={key} data-theme-token-row={token ?? colorKey}>
        <SurfacePanel padding="sm" className="flex items-center gap-3 rounded-xl shadow-none">
          <div className="min-w-0 grow">
            <p className="truncate text-sm font-medium text-ink">
              <Translate>{label}</Translate>
            </p>
            <p className="truncate text-xs text-ink-muted">
              <Translate>{hint}</Translate>
            </p>
            <p className="text-xs text-ink-muted">{displayValue}</p>
          </div>
          <ColorPicker
            name={name}
            value={displayValue}
            options={options}
            suggested={headerOptions?.[0] ?? (spec ? options[0] : undefined)}
            onChange={onChange}
          />
          <Button
            type="button"
            size="small"
            variant="ghost"
            onClick={onReset}
            disabled={resetDisabled}
          >
            <Translate>Reset</Translate>
          </Button>
        </SurfacePanel>
      </div>
    );
  };

  return (
    <div className="border-t border-[color-mix(in_srgb,var(--color-theme-border-primary)_40%,transparent)] px-4 py-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <Translate>Chrome header</Translate>
      </p>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {HEADER_CHROME_VAR_KEYS.map(key =>
          row({
            key: `${previewMode}-header-${key}`,
            token: key,
            label: CHROME_VAR_LABELS[key],
            hint: CHROME_VAR_HINTS[key],
            displayValue: resolvedMergedPreview[key] ?? '#000000',
            name: `${previewMode}-chrome-${key}`,
            onChange: color => updateChromeModeVar(previewMode, key, color),
            onReset: () => updateChromeModeVar(previewMode, key, undefined),
            resetDisabled: !themeVars[themeStorageKey(previewMode, key)],
          })
        )}
      </div>
      {colorChunks.map(chunk => (
        <div key={chunk.title} className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <Translate>{chunk.title}</Translate>
          </p>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {chunk.keys.map(key =>
              row({
                key: `${previewMode}-${key}`,
                colorKey: key,
                label: SEMANTIC_VAR_LABELS[key],
                hint: SEMANTIC_VAR_HINTS[key],
                displayValue: resolvedPreviewTheme[key] ?? '#000000',
                name: `${previewMode}-${key}`,
                onChange: color => updateModeVar(previewMode, key, color),
                onReset: () => updateModeVar(previewMode, key, undefined),
                resetDisabled: !themeVars[themeStorageKey(previewMode, key)],
              })
            )}
          </div>
        </div>
      ))}
      <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <Translate>Settings</Translate>
      </p>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {SETTINGS_CHROME_VAR_KEYS.map(key =>
          row({
            key: `${previewMode}-settings-${key}`,
            colorKey: key,
            label: CHROME_VAR_LABELS[key],
            hint: CHROME_VAR_HINTS[key],
            displayValue: resolvedMergedPreview[key] ?? '#000000',
            name: `${previewMode}-settings-${key}`,
            onChange: color => updateChromeModeVar(previewMode, key, color),
            onReset: () => updateChromeModeVar(previewMode, key, undefined),
            resetDisabled: !themeVars[themeStorageKey(previewMode, key)],
          })
        )}
      </div>
    </div>
  );
};

export { ThemeAdvancedColorsSection };
