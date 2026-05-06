import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { ColorPicker } from '#V2/Components/Forms/ColorPicker.js';
import { Button, SurfacePanel } from '#V2/Components/UI/index.js';
import {
  CHROME_OVERRIDE_VAR_KEYS,
  CHROME_VAR_LABELS,
  colorPaletteFromHex,
  SEMANTIC_VAR_KEYS,
  SEMANTIC_VAR_LABELS,
  sortPaletteHexColors,
  themeStorageKey,
} from '#V2/theme/index.js';
import type { ChromeOverrideVarKey, SemanticVarKey, ThemeMode } from '#V2/theme/index.js';

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
}: ThemeAdvancedColorsSectionProps) => (
  <div className="border-t [border-color:color-mix(in_srgb,var(--color-theme-border-primary)_40%,transparent)] px-4 py-4">
    <div className="space-y-3">
      {SEMANTIC_VAR_KEYS.map(key => {
        const storageKey = themeStorageKey(previewMode, key);
        const override = themeVars[storageKey];
        const displayValue = resolvedPreviewTheme[key] ?? '#000000';

        return (
          <SurfacePanel
            key={`${previewMode}-${key}`}
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
              name={`${previewMode}-${key}`}
              value={displayValue}
              options={pickerOptions(displayValue, colorOptions)}
              onChange={color => updateModeVar(previewMode, key, color)}
            />

            <Button
              type="button"
              size="small"
              variant="ghost"
              onClick={() => updateModeVar(previewMode, key, undefined)}
              disabled={!override}
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
    <div className="space-y-3">
      {CHROME_OVERRIDE_VAR_KEYS.map(key => {
        const sk = themeStorageKey(previewMode, key);
        const override = themeVars[sk];
        const displayValue = resolvedMergedPreview[key] ?? '#000000';

        return (
          <SurfacePanel
            key={`${previewMode}-chrome-${key}`}
            padding="sm"
            className="flex items-center gap-3 rounded-xl shadow-none"
          >
            <div className="min-w-0 grow">
              <p className="truncate text-sm font-medium text-ink" title={key}>
                <Translate>{CHROME_VAR_LABELS[key]}</Translate>
              </p>
              <p className="text-xs text-ink-muted">{displayValue}</p>
            </div>

            <ColorPicker
              name={`${previewMode}-chrome-${key}`}
              value={displayValue}
              options={pickerOptions(displayValue, colorOptions)}
              onChange={color => updateChromeModeVar(previewMode, key, color)}
            />

            <Button
              type="button"
              size="small"
              variant="ghost"
              onClick={() => updateChromeModeVar(previewMode, key, undefined)}
              disabled={!override}
            >
              <Translate>Reset</Translate>
            </Button>
          </SurfacePanel>
        );
      })}
    </div>
  </div>
);

export { ThemeAdvancedColorsSection };
