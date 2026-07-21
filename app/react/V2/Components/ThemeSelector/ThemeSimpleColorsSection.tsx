import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { ColorPicker } from '#V2/Components/Forms/ColorPicker.js';
import { Button, SurfacePanel } from '#V2/Components/UI/index.js';
import {
  applySimpleModeSemanticsForMode,
  SIMPLE_SEMANTIC_ANCHOR_KEYS,
  SEMANTIC_VAR_LABELS,
  themeStorageKey,
  colorPaletteFromHex,
  sortPaletteHexColors,
  normalizeHex,
} from '#V2/theme/index.js';
import type { SimpleSemanticAnchorKey } from '#V2/theme/themeSimpleDerivation.js';
import { PRESET_DEFINITIONS } from '#V2/theme/tokens.js';
import type {
  ResolvedThemeVars,
  SemanticVarKey,
  ThemeMode,
  ThemePresetId,
} from '#V2/theme/index.js';

type ThemeVars = Record<string, string | undefined>;

type ThemeSimpleColorsSectionProps = {
  previewMode: ThemeMode;
  themeVars: ThemeVars;
  basePreset: ThemePresetId;
  resolvedPreviewTheme: ThemeVars;
  resolvedMergedPreview: Record<string, string>;
  colorOptions: string[];
  getResolved: (mode: ThemeMode) => ResolvedThemeVars;
  onChange: (value: ThemeVars) => void;
  setSimpleChromeBar: (mode: ThemeMode, hex: string | undefined) => void;
};

const pickerOptions = (displayValue: string, colorOptions: string[]) =>
  sortPaletteHexColors([...new Set([...colorPaletteFromHex(displayValue), ...colorOptions])]);

const ThemeSimpleColorsSection = ({
  previewMode,
  themeVars,
  basePreset,
  resolvedPreviewTheme,
  resolvedMergedPreview,
  colorOptions,
  getResolved,
  onChange,
  setSimpleChromeBar,
}: ThemeSimpleColorsSectionProps) => {
  const presetSource = PRESET_DEFINITIONS[basePreset].sourceModes[previewMode];

  const patchAnchors = (patch: Partial<Record<SimpleSemanticAnchorKey, string>>) => {
    onChange(
      applySimpleModeSemanticsForMode(themeVars, previewMode, basePreset, patch, getResolved)
    );
  };

  const chromeBarKey = '--color-theme-chrome-app-bar' as const;
  const chromeStorage = themeStorageKey(previewMode, chromeBarKey);
  const chromeOverride = themeVars[chromeStorage];
  const chromeDisplay = resolvedMergedPreview[chromeBarKey] ?? '#000000';

  return (
    <div className="border-t border-[color-mix(in_srgb,var(--color-theme-border-primary)_40%,transparent)] px-4 py-4">
      <p className="mb-3 text-xs text-ink-muted">
        <Translate>
          Adjust a few colors; secondary text and muted backgrounds update automatically.
        </Translate>
      </p>
      <div className="space-y-3">
        {SIMPLE_SEMANTIC_ANCHOR_KEYS.map(key => {
          const displayValue = resolvedPreviewTheme[key] ?? '#000000';
          const presetDefault = presetSource[key as SemanticVarKey];

          return (
            <SurfacePanel
              key={`${previewMode}-simple-${key}`}
              padding="sm"
              className="flex items-center gap-3 rounded-xl shadow-none"
            >
              <div className="min-w-0 grow">
                <p className="truncate text-sm font-medium text-ink">
                  {SEMANTIC_VAR_LABELS[key] ?? key}
                </p>
                <p className="text-xs text-ink-muted">{displayValue}</p>
              </div>

              <ColorPicker
                name={`${previewMode}-simple-${key}`}
                value={displayValue}
                options={pickerOptions(displayValue, colorOptions)}
                onChange={color => patchAnchors({ [key]: color })}
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
          );
        })}
      </div>
      <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <Translate>Chrome header</Translate>
      </p>
      <SurfacePanel padding="sm" className="flex items-center gap-3 rounded-xl shadow-none">
        <div className="min-w-0 grow">
          <p className="truncate text-sm font-medium text-ink">
            <Translate>Header bar background</Translate>
          </p>
          <p className="text-xs text-ink-muted">{chromeDisplay}</p>
        </div>
        <ColorPicker
          name={`${previewMode}-simple-chrome-bar`}
          value={chromeDisplay}
          options={pickerOptions(chromeDisplay, colorOptions)}
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
  );
};

export { ThemeSimpleColorsSection };
