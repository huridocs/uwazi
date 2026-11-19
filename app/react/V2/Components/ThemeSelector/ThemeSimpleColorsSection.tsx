import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { ColorPicker } from '#V2/Components/Forms/ColorPicker.js';
import { Button, SurfacePanel } from '#V2/Components/UI/index.js';
import {
  applySimpleModeSemanticsForMode,
  SIMPLE_SEMANTIC_ANCHOR_KEYS,
  SEMANTIC_VAR_HINTS,
  SEMANTIC_VAR_LABELS,
  CHROME_VAR_HINTS,
  CHROME_VAR_LABELS,
  headerPickerColors,
  relatedPickerColors,
  relatedPickerSpec,
  themeStorageKey,
  colorPaletteFromHex,
  sortPaletteHexColors,
  normalizeHex,
  appliedTheme,
  THEME_PRESET_KEY,
} from '#V2/theme/index.js';
import type { ThemeVarsChange } from './themeTokenFocus.js';
import type { SimpleSemanticAnchorKey } from '#V2/theme/themeSimpleDerivation.js';
import { PRESET_DEFINITIONS } from '#V2/theme/tokens.js';
import type {
  ChromeOverrideVarKey,
  SemanticVarKey,
  ThemeMode,
  ThemePresetId,
} from '#V2/theme/index.js';

const simpleColorGroups: { title: string; keys: readonly SimpleSemanticAnchorKey[] }[] = [
  {
    title: 'Actions',
    keys: SIMPLE_SEMANTIC_ANCHOR_KEYS.filter(key => key.startsWith('--color-theme-accent')),
  },
  {
    title: 'Page',
    keys: SIMPLE_SEMANTIC_ANCHOR_KEYS.filter(key => !key.startsWith('--color-theme-accent')),
  },
];

type ThemeVars = Record<string, string | undefined>;

type ThemeSimpleColorsSectionProps = {
  previewMode: ThemeMode;
  themeVars: ThemeVars;
  basePreset: ThemePresetId;
  resolvedPreviewTheme: ThemeVars;
  resolvedMergedPreview: Record<string, string>;
  colorOptions: string[];
  onChange: ThemeVarsChange;
  setSimpleChromeBar: (mode: ThemeMode, hex: string | undefined) => void;
  updateChromeModeVar: (
    mode: ThemeMode,
    key: ChromeOverrideVarKey,
    nextValue: string | undefined
  ) => void;
  updateModeVar: (mode: ThemeMode, key: SemanticVarKey, nextValue: string | undefined) => void;
};

const simpleHeaderKeys: readonly ChromeOverrideVarKey[] = [
  '--color-theme-chrome-app-bar-fg',
  '--color-theme-chrome-app-bar-hover',
];

const pickerOptions = (displayValue: string, colorOptions: string[]) =>
  sortPaletteHexColors([...new Set([...colorPaletteFromHex(displayValue), ...colorOptions])]);

const ThemeSimpleColorsSection = ({
  previewMode,
  themeVars,
  basePreset,
  resolvedPreviewTheme,
  resolvedMergedPreview,
  colorOptions,
  onChange,
  setSimpleChromeBar,
  updateChromeModeVar,
  updateModeVar,
}: ThemeSimpleColorsSectionProps) => {
  const presetSource = PRESET_DEFINITIONS[basePreset].sourceModes[previewMode];

  const patchAnchors = (patch: Partial<Record<SimpleSemanticAnchorKey, string>>) => {
    onChange(current =>
      applySimpleModeSemanticsForMode(current, previewMode, basePreset, patch, mode =>
        appliedTheme({ ...current, [THEME_PRESET_KEY]: basePreset }, mode, true)
      )
    );
  };

  const chromeBarKey = '--color-theme-chrome-app-bar' as const;
  const chromeStorage = themeStorageKey(previewMode, chromeBarKey);
  const chromeOverride = themeVars[chromeStorage];
  const chromeDisplay = resolvedMergedPreview[chromeBarKey] ?? '#000000';
  const headerText = resolvedMergedPreview['--color-theme-chrome-app-bar-fg'] ?? '#1A1A1A';
  const barOptions = pickerOptions(chromeDisplay, colorOptions);

  return (
    <div className="border-t border-[color-mix(in_srgb,var(--color-theme-border-primary)_40%,transparent)] px-4 py-4">
      <p className="mb-3 text-xs text-ink-muted">
        <Translate>
          Adjust a few colors; secondary text and muted backgrounds update automatically.
        </Translate>
      </p>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <Translate>Chrome header</Translate>
      </p>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div data-theme-token-row="--color-theme-chrome-app-bar">
          <SurfacePanel padding="sm" className="flex items-center gap-3 rounded-xl shadow-none">
            <div className="min-w-0 grow">
              <p className="truncate text-sm font-medium text-ink">
                <Translate>Header bar background</Translate>
              </p>
              <p className="truncate text-xs text-ink-muted">
                <Translate>{CHROME_VAR_HINTS['--color-theme-chrome-app-bar']}</Translate>
              </p>
              <p className="text-xs text-ink-muted">{chromeDisplay}</p>
            </div>
            <ColorPicker
              name={`${previewMode}-simple-chrome-bar`}
              value={chromeDisplay}
              options={barOptions}
              onChange={color => setSimpleChromeBar(previewMode, color)}
            />
            <Button
              type="button"
              size="small"
              variant="ghost"
              onClick={() => setSimpleChromeBar(previewMode, undefined)}
              disabled={!chromeOverride}
            >
              <Translate>Reset</Translate>
            </Button>
          </SurfacePanel>
        </div>
        {simpleHeaderKeys.map(key => {
          const displayValue = resolvedMergedPreview[key] ?? '#000000';
          const options = headerPickerColors({
            key,
            displayValue,
            colorOptions,
            bar: resolvedMergedPreview['--color-theme-chrome-app-bar'] ?? displayValue,
            text: headerText,
          });
          return (
            <div key={`${previewMode}-simple-${key}`} data-theme-token-row={key}>
              <SurfacePanel padding="sm" className="flex items-center gap-3 rounded-xl shadow-none">
                <div className="min-w-0 grow">
                  <p className="truncate text-sm font-medium text-ink">
                    <Translate>{CHROME_VAR_LABELS[key]}</Translate>
                  </p>
                  <p className="truncate text-xs text-ink-muted">
                    <Translate>{CHROME_VAR_HINTS[key]}</Translate>
                  </p>
                  <p className="text-xs text-ink-muted">{displayValue}</p>
                </div>
                <ColorPicker
                  name={`${previewMode}-simple-${key}`}
                  value={displayValue}
                  options={options}
                  suggested={options[0]}
                  onChange={color => updateChromeModeVar(previewMode, key, color)}
                />
                <Button
                  type="button"
                  size="small"
                  variant="ghost"
                  onClick={() => updateChromeModeVar(previewMode, key, undefined)}
                  disabled={!themeVars[themeStorageKey(previewMode, key)]}
                >
                  <Translate>Reset</Translate>
                </Button>
              </SurfacePanel>
            </div>
          );
        })}
      </div>
      {simpleColorGroups.map(group => (
        <div key={group.title} className="mt-6 first:mt-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <Translate>{group.title}</Translate>
          </p>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {group.keys.map(key => {
              const displayValue = resolvedPreviewTheme[key] ?? '#000000';
              const presetDefault = presetSource[key as SemanticVarKey];
              const spec = relatedPickerSpec(key, {
                page: resolvedPreviewTheme['--color-theme-bg-primary'] ?? '#FFFFFF',
                surface: resolvedPreviewTheme['--color-theme-bg-surface'] ?? '#FFFFFF',
                text: resolvedPreviewTheme['--color-theme-text-primary'] ?? '#1A1A1A',
                rail: resolvedMergedPreview['--color-theme-chrome-settings-rail-bg'] ?? '#FFFFFF',
              });
              const options = spec
                ? relatedPickerColors({ ...spec, displayValue, colorOptions })
                : pickerOptions(displayValue, colorOptions);
              const setsCompanions =
                key === '--color-theme-bg-primary' ||
                key === '--color-theme-bg-surface' ||
                key === '--color-theme-text-primary';

              return (
                <div key={`${previewMode}-simple-${key}`} data-theme-token-row={key}>
                  <SurfacePanel
                    padding="sm"
                    className="flex items-center gap-3 rounded-xl shadow-none"
                  >
                    <div className="min-w-0 grow">
                      <p className="truncate text-sm font-medium text-ink">
                        {SEMANTIC_VAR_LABELS[key] ?? key}
                      </p>
                      <p className="truncate text-xs text-ink-muted">
                        <Translate>{SEMANTIC_VAR_HINTS[key]}</Translate>
                      </p>
                      <p className="text-xs text-ink-muted">{displayValue}</p>
                    </div>

                    <ColorPicker
                      name={`${previewMode}-simple-${key}`}
                      value={displayValue}
                      options={options}
                      suggested={spec ? options[0] : undefined}
                      onChange={color =>
                        setsCompanions
                          ? updateModeVar(previewMode, key, color)
                          : patchAnchors({ [key]: color })
                      }
                    />

                    <Button
                      type="button"
                      size="small"
                      variant="ghost"
                      onClick={() => patchAnchors({ [key]: presetDefault })}
                      disabled={normalizeHex(displayValue) === normalizeHex(presetDefault)}
                    >
                      <Translate>Reset</Translate>
                    </Button>
                  </SurfacePanel>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export { ThemeSimpleColorsSection };
