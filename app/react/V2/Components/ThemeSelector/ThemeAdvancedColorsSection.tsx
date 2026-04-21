import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { ColorPicker } from '#V2/Components/Forms/ColorPicker.js';
import { Button, SectionHeading, SurfacePanel } from '#V2/Components/UI/index.js';
import { SEMANTIC_VAR_KEYS, SEMANTIC_VAR_LABELS, themeStorageKey } from '#V2/theme/themes.js';
import type { SemanticVarKey, ThemeMode } from '#V2/theme/themes.js';

type ThemeVars = Record<string, string | undefined>;

type ThemeAdvancedColorsSectionProps = {
  previewMode: ThemeMode;
  showAdvanced: boolean;
  setShowAdvanced: React.Dispatch<React.SetStateAction<boolean>>;
  themeVars: ThemeVars;
  resolvedPreviewTheme: ThemeVars;
  colorOptions: string[];
  updateModeVar: (mode: ThemeMode, key: SemanticVarKey, nextValue: string | undefined) => void;
};

const ThemeAdvancedColorsSection = ({
  previewMode,
  showAdvanced,
  setShowAdvanced,
  themeVars,
  resolvedPreviewTheme,
  colorOptions,
  updateModeVar,
}: ThemeAdvancedColorsSectionProps) => (
  <SurfacePanel padding="none" className="rounded-xl">
    <button
      type="button"
      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      onClick={() => setShowAdvanced(current => !current)}
    >
      <SectionHeading>
        <Translate>Advanced colors</Translate>
      </SectionHeading>
      <span className="text-xs font-medium text-supporting">
        {showAdvanced ? <Translate>Hide</Translate> : <Translate>Customize</Translate>}
      </span>
    </button>

    {showAdvanced ? (
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
                  options={colorOptions}
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
      </div>
    ) : null}
  </SurfacePanel>
);

export { ThemeAdvancedColorsSection };
