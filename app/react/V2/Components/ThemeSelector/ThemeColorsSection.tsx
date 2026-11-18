import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';
import { Button, SurfacePanel } from '#V2/Components/UI/index.js';
import {
  THEME_EDITOR_MODE_KEY,
  THEME_PRESET_KEY,
  appliedTheme,
  buildThemeInstanceExport,
  downloadThemeInstance,
  recomputeSimpleThemeVarsFromAnchors,
  simpleBasePreset,
  THEME_SIMPLE_BASE_KEY,
} from '#V2/theme/index.js';
import type {
  ThemeAssetPresetId,
  ThemeMode,
  ThemePresetId,
  ChromeOverrideVarKey,
  SemanticVarKey,
} from '#V2/theme/index.js';
import { ThemeAdvancedColorsSection } from './ThemeAdvancedColorsSection.js';
import { ThemeSimpleColorsSection } from './ThemeSimpleColorsSection.js';
import { themeColorsStartOpen } from './themeColorsLayout.js';
import { useRevealThemeToken, type ThemeVarsChange } from './themeTokenFocus.js';

type ThemeVars = Record<string, string | undefined>;

type ThemeColorsSectionProps = {
  previewMode: ThemeMode;
  selectedPreset: ThemePresetId;
  assetPreset?: ThemeAssetPresetId;
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
  onImportThemeInstanceText: (text: string) => void;
  onChange: ThemeVarsChange;
  setSimpleChromeBar: (mode: ThemeMode, hex: string | undefined) => void;
};

const ThemeColorsSection = ({
  previewMode,
  selectedPreset,
  assetPreset,
  themeVars,
  resolvedPreviewTheme,
  resolvedMergedPreview,
  colorOptions,
  updateModeVar,
  updateChromeModeVar,
  onImportThemeInstanceText,
  onChange,
  setSimpleChromeBar,
}: ThemeColorsSectionProps) => {
  const editorMode = themeVars[THEME_EDITOR_MODE_KEY] === 'advanced' ? 'advanced' : 'simple';
  const basePreset = simpleBasePreset(
    selectedPreset,
    assetPreset,
    themeVars[THEME_SIMPLE_BASE_KEY]
  );
  const resolveBase = (mode: ThemeMode) =>
    appliedTheme({ ...themeVars, [THEME_PRESET_KEY]: basePreset }, mode, true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(true);
  useRevealThemeToken({ editorMode, open, setOpen, previewMode, onChange });

  React.useEffect(() => {
    if (!themeColorsStartOpen(window.innerWidth)) setOpen(false);
  }, []);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImportThemeInstanceText(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  return (
    <SurfacePanel padding="none" className="mb-6 rounded-xl">
      <div className="flex w-full flex-wrap items-center justify-end px-4 py-3">
        <button
          type="button"
          className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-sm font-medium text-ink-secondary underline decoration-from-font underline-offset-2 transition-colors hover:text-ink"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          <ChevronDownIcon
            className={`h-4 w-4 shrink-0 transition-transform duration-200 text-ink-secondary ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
          <Translate>Advanced colors</Translate>
        </button>
      </div>

      {open ? (
        <>
          <div className="border-t border-[color-mix(in_srgb,var(--color-theme-border-primary)_40%,transparent)] px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={onFileChange}
              />
              <Button
                type="button"
                size="small"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Translate>Import theme instance file</Translate>
              </Button>
              <Button
                type="button"
                size="small"
                variant="secondary"
                onClick={() =>
                  downloadThemeInstance(buildThemeInstanceExport(themeVars, assetPreset))
                }
              >
                <Translate>Export theme instance file</Translate>
              </Button>
              <div className="flex flex-wrap gap-1 sm:ml-auto">
                <Button
                  type="button"
                  size="small"
                  variant={editorMode === 'simple' ? 'primary' : 'secondary'}
                  onClick={() =>
                    onChange(current => {
                      const base = simpleBasePreset(
                        selectedPreset,
                        assetPreset,
                        current[THEME_SIMPLE_BASE_KEY]
                      );
                      return recomputeSimpleThemeVarsFromAnchors(current, base, mode =>
                        appliedTheme({ ...current, [THEME_PRESET_KEY]: base }, mode, true)
                      );
                    })
                  }
                >
                  <Translate>Simple mode</Translate>
                </Button>
                <Button
                  type="button"
                  size="small"
                  variant={editorMode === 'advanced' ? 'primary' : 'secondary'}
                  onClick={() =>
                    onChange(current => ({ ...current, [THEME_EDITOR_MODE_KEY]: 'advanced' }))
                  }
                >
                  <Translate>Full mode</Translate>
                </Button>
              </div>
            </div>
          </div>

          {editorMode === 'simple' ? (
            <ThemeSimpleColorsSection
              previewMode={previewMode}
              themeVars={themeVars}
              basePreset={basePreset}
              resolvedPreviewTheme={resolvedPreviewTheme}
              resolvedMergedPreview={resolvedMergedPreview}
              colorOptions={colorOptions}
              getResolved={resolveBase}
              onChange={onChange}
              setSimpleChromeBar={setSimpleChromeBar}
              updateChromeModeVar={updateChromeModeVar}
              updateModeVar={updateModeVar}
            />
          ) : (
            <ThemeAdvancedColorsSection
              previewMode={previewMode}
              themeVars={themeVars}
              resolvedPreviewTheme={resolvedPreviewTheme}
              resolvedMergedPreview={resolvedMergedPreview}
              colorOptions={colorOptions}
              updateModeVar={updateModeVar}
              updateChromeModeVar={updateChromeModeVar}
            />
          )}
        </>
      ) : null}
    </SurfacePanel>
  );
};

export { ThemeColorsSection };
