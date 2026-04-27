import React from 'react';
import { useAtomValue } from 'jotai';
import { effectiveThemeModeAtom } from '#V2/atoms/index.js';
import {
  appliedTheme,
  getCustomThemeVars,
  getThemeAsset,
  getThemeAssetPresetId,
  getPresetId,
  getPresetVars,
  isValidHex,
  NAMED_THEMES,
  SEMANTIC_VAR_KEYS,
  THEME_MODES,
  themeStorageKey,
  toCanonicalThemeVars,
  type SemanticVarKey,
  type ThemeAssets,
  type ThemeMode,
} from '#V2/theme/themes.js';
import { ThemeAdvancedColorsSection } from './ThemeAdvancedColorsSection.js';
import { ThemePresetSection } from './ThemePresetSection.js';
import { ThemePreviewSection } from './ThemePreviewSection.js';

type ThemeSelectorProps = {
  value: Record<string, string | undefined>;
  onChange: (value: Record<string, string | undefined>) => void;
  themeAssets?: ThemeAssets;
  onThemeAssetsChange?: (value: ThemeAssets) => void;
  siteLogo?: string | undefined;
  favicon?: string | undefined;
  panelOpen?: boolean;
};

const ThemeSelector = ({
  value,
  onChange,
  themeAssets,
  onThemeAssetsChange,
  siteLogo,
  favicon,
  panelOpen,
}: ThemeSelectorProps) => {
  const activeThemeMode = useAtomValue(effectiveThemeModeAtom);
  const themeVars = React.useMemo(() => toCanonicalThemeVars(value), [value]);
  const selectedPreset = getPresetId(themeVars, true);
  const [previewMode, setPreviewMode] = React.useState<ThemeMode>(activeThemeMode);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const wasPanelOpen = React.useRef(false);
  const previewLogo = getThemeAsset(themeAssets, themeVars, previewMode, 'siteLogo', siteLogo);
  const previewFavicon = getThemeAsset(themeAssets, themeVars, previewMode, 'favicon', favicon);
  const resolvedPreviewTheme = React.useMemo(
    () => appliedTheme(themeVars, previewMode, true),
    [themeVars, previewMode]
  );
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

    if (nextValue === undefined || nextValue === '') {
      delete next[key];
    } else {
      next[key] = nextValue;
    }

    onChange(next);
  };

  const updateModeVar = (mode: ThemeMode, key: SemanticVarKey, nextValue: string | undefined) => {
    update(themeStorageKey(mode, key), nextValue);
  };

  const handleSelectPreset = (presetId: (typeof NAMED_THEMES)[number]['id']) => {
    onChange(presetId === 'custom' ? getCustomThemeVars(themeVars, true) : getPresetVars(presetId));

    if (presetId === 'default' || presetId === 'legacy') {
      onThemeAssetsChange?.({
        ...themeAssets,
        preset: presetId,
      });
    }

    if (presetId === 'custom') {
      onThemeAssetsChange?.({
        ...themeAssets,
        preset: getThemeAssetPresetId(themeAssets, themeVars, true),
      });
    }
  };

  React.useEffect(() => {
    setPreviewMode(activeThemeMode);
  }, [activeThemeMode]);

  React.useEffect(() => {
    if (panelOpen === undefined) return;
    if (panelOpen && !wasPanelOpen.current) {
      setPreviewMode(activeThemeMode);
    }
    wasPanelOpen.current = panelOpen;
  }, [panelOpen, activeThemeMode]);

  return (
    <div className="flex flex-col gap-6">
      <ThemePresetSection
        themeVars={themeVars}
        selectedPreset={selectedPreset}
        onSelectPreset={handleSelectPreset}
      />

      <ThemePreviewSection
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        themeVars={themeVars}
        siteLogo={previewLogo}
        favicon={previewFavicon}
      />

      <ThemeAdvancedColorsSection
        previewMode={previewMode}
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
        themeVars={themeVars}
        resolvedPreviewTheme={resolvedPreviewTheme}
        colorOptions={colorOptions}
        updateModeVar={updateModeVar}
      />
    </div>
  );
};

export { ThemeSelector };
