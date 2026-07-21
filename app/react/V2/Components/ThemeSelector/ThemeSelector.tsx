import React from 'react';
import { useAtomValue } from 'jotai';
import { t } from '#app/I18N/index.js';
import { effectiveThemeModeAtom } from '#V2/atoms/index.js';
import { getScopedThemeVars } from '#V2/theme/themeScopedVars.js';
import {
  appliedTheme,
  CHROME_OVERRIDE_VAR_KEYS,
  getChromeStyleOverrides,
  getCustomThemeVars,
  getThemeAsset,
  getThemeAssetPresetId,
  getPresetId,
  getPresetVars,
  isValidHex,
  mergeScopedThemeAndChrome,
  NAMED_THEMES,
  parseThemeInstanceImportJson,
  SEMANTIC_VAR_KEYS,
  THEME_EDITOR_MODE_KEY,
  THEME_PALETTE,
  THEME_MODES,
  stripChromeStorageKeysAbsentFromImport,
  themeStorageKey,
  toCanonicalThemeVars,
  type ChromeOverrideVarKey,
  type SemanticVarKey,
  type ThemeAssets,
  type ThemeMode,
} from '#V2/theme/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
import { ThemeColorsSection } from './ThemeColorsSection.js';
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
  const wasPanelOpen = React.useRef(false);
  const previewLogo = getThemeAsset(themeAssets, themeVars, previewMode, 'siteLogo', siteLogo);
  const previewFavicon = getThemeAsset(themeAssets, themeVars, previewMode, 'favicon', favicon);
  const resolvedPreviewTheme = React.useMemo(
    () => appliedTheme(themeVars, previewMode, true),
    [themeVars, previewMode]
  );
  const resolvedMergedPreview = React.useMemo(() => {
    const resolved = appliedTheme(themeVars, previewMode, true);
    const presetId = getPresetId(themeVars, true);
    const scoped = getScopedThemeVars(presetId, resolved);
    const chrome = getChromeStyleOverrides(themeVars, previewMode);
    return mergeScopedThemeAndChrome(scoped, chrome, resolved);
  }, [themeVars, previewMode]);
  const colorOptions = React.useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...THEME_PALETTE.map(entry => entry.hex),
            ...NAMED_THEMES.flatMap(theme =>
              THEME_MODES.flatMap(mode => SEMANTIC_VAR_KEYS.map(key => theme.modes[mode][key]))
            ),
            ...THEME_MODES.flatMap(mode =>
              SEMANTIC_VAR_KEYS.map(key => appliedTheme(themeVars, mode, true)[key])
            ),
            ...CHROME_OVERRIDE_VAR_KEYS.map(key => resolvedMergedPreview[key]).filter(
              (v): v is string => typeof v === 'string' && isValidHex(v)
            ),
          ].filter(isValidHex)
        )
      ),
    [themeVars, resolvedMergedPreview]
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

  const updateChromeModeVar = (
    mode: ThemeMode,
    key: ChromeOverrideVarKey,
    nextValue: string | undefined
  ) => {
    update(themeStorageKey(mode, key), nextValue);
  };

  const setSimpleChromeBar = (mode: ThemeMode, hex: string | undefined) => {
    const next: Record<string, string | undefined> = {
      ...themeVars,
      [THEME_EDITOR_MODE_KEY]: 'simple',
    };
    CHROME_OVERRIDE_VAR_KEYS.forEach(key => {
      delete next[themeStorageKey(mode, key)];
    });
    if (hex) {
      next[themeStorageKey(mode, '--color-theme-chrome-app-bar')] = hex;
    }
    onChange(next);
  };

  const handleImportThemeInstanceText = (text: string) => {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(text);
    } catch {
      notify(t('System', 'Theme instance file invalid', null, false), 'error');
      return;
    }
    const parsed = parseThemeInstanceImportJson(parsedJson);
    if ('error' in parsed) {
      notify(t('System', 'Theme instance file invalid', null, false), 'error', parsed.error);
      return;
    }
    const materialized = getCustomThemeVars(themeVars, true);
    const withoutStaleChrome = stripChromeStorageKeysAbsentFromImport(materialized, parsed.flat);
    const next = { ...withoutStaleChrome, ...parsed.flat, [THEME_EDITOR_MODE_KEY]: 'advanced' };
    onChange(next);
    onThemeAssetsChange?.({
      ...themeAssets,
      preset: getThemeAssetPresetId(themeAssets, next, true),
    });
    notify(t('System', 'Theme colors imported', null, false), 'success');
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

      <ThemeColorsSection
        previewMode={previewMode}
        selectedPreset={selectedPreset}
        themeVars={themeVars}
        resolvedPreviewTheme={resolvedPreviewTheme}
        resolvedMergedPreview={resolvedMergedPreview}
        colorOptions={colorOptions}
        getResolved={mode => appliedTheme(themeVars, mode, true)}
        updateModeVar={updateModeVar}
        updateChromeModeVar={updateChromeModeVar}
        onImportThemeInstanceText={handleImportThemeInstanceText}
        onChange={onChange}
        setSimpleChromeBar={setSimpleChromeBar}
      />
    </div>
  );
};

export { ThemeSelector };
