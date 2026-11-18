import React from 'react';
import { useAtomValue } from 'jotai';
import { t } from '#app/I18N/index.js';
import { effectiveThemeModeAtom } from '#V2/atoms/index.js';
import { getScopedThemeVars } from '#V2/theme/themeScopedVars.js';
import { selectThemePreset } from '#V2/theme/themePresetBackup.js';
import {
  appliedTheme,
  CHROME_OVERRIDE_VAR_KEYS,
  getChromeStyleOverrides,
  getThemeAsset,
  getThemeAssetPresetId,
  themeAssetsForPreset,
  themeAssetsFromImport,
  getPresetId,
  isValidHex,
  mergeScopedThemeAndChrome,
  NAMED_THEMES,
  parseThemeInstanceImportText,
  SEMANTIC_VAR_KEYS,
  headerColorsFromBar,
  semanticColorsFromEdit,
  settingsColorsFromRail,
  simpleChromeFromBar,
  THEME_PALETTE,
  THEME_MODES,
  themeStorageKey,
  toCanonicalThemeVars,
  themeVarsFromInstanceImport,
  simpleBaseFromFile,
  type ChromeOverrideVarKey,
  type SemanticVarKey,
  type ThemeAssets,
  type ThemeMode,
} from '#V2/theme/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
import { ThemeColorsSection } from './ThemeColorsSection.js';
import type { ThemeVarsChange } from './themeTokenFocus.js';
import { ThemePresetSection } from './ThemePresetSection.js';
import { ThemePreviewSection } from './ThemePreviewSection.js';

type ThemeVars = Record<string, string | undefined>;

const storedVar = (current: ThemeVars, key: string, nextValue: string | undefined): ThemeVars => {
  const next = { ...current };
  if (nextValue === undefined || nextValue === '') delete next[key];
  else next[key] = nextValue;
  return next;
};

type ThemeSelectorProps = {
  value: Record<string, string | undefined>;
  onChange: ThemeVarsChange;
  themeAssets?: ThemeAssets;
  onThemeAssetsChange?: (value: ThemeAssets) => void;
  siteLogo?: string | undefined;
  siteName?: string;
  favicon?: string | undefined;
  panelOpen?: boolean;
  children?: React.ReactNode;
};

const ThemeSelector = ({
  value,
  onChange,
  themeAssets,
  onThemeAssetsChange,
  siteLogo,
  siteName,
  favicon,
  panelOpen,
  children,
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

  const updateModeVar = (mode: ThemeMode, key: SemanticVarKey, nextValue: string | undefined) => {
    onChange(current => {
      const resolved = appliedTheme(current, mode, true);
      const related =
        nextValue &&
        semanticColorsFromEdit(
          {
            themeVars: current,
            mode,
            hex: nextValue,
            context: {
              page: resolved['--color-theme-bg-primary'],
              surface: resolved['--color-theme-bg-surface'],
              text: resolved['--color-theme-text-primary'],
            },
          },
          key
        );
      if (!related) return storedVar(current, themeStorageKey(mode, key), nextValue);
      return related;
    });
  };

  const updateChromeModeVar = (
    mode: ThemeMode,
    key: ChromeOverrideVarKey,
    nextValue: string | undefined
  ) => {
    onChange(current => {
      if (key === '--color-theme-chrome-app-bar') {
        return headerColorsFromBar(current, mode, nextValue);
      }
      if (key === '--color-theme-chrome-settings-rail-bg' && nextValue) {
        return settingsColorsFromRail(current, mode, nextValue);
      }
      return storedVar(current, themeStorageKey(mode, key), nextValue);
    });
  };

  const setSimpleChromeBar = (mode: ThemeMode, hex: string | undefined) => {
    onChange(current => simpleChromeFromBar(current, mode, hex));
  };

  const handleImportThemeInstanceText = (text: string) => {
    const parsed = parseThemeInstanceImportText(text);
    if ('error' in parsed) {
      notify(t('System', 'Theme instance file invalid', null, false), 'error', parsed.error);
      return;
    }
    const next = themeVarsFromInstanceImport(
      parsed.flat,
      parsed.editorMode,
      simpleBaseFromFile(parsed.presetId, parsed.assetPreset)
    );
    onChange(next);
    onThemeAssetsChange?.(themeAssetsFromImport(themeAssets, parsed.presetId, parsed.assetPreset));
    notify(t('System', 'Theme colors imported', null, false), 'success');
  };

  const handleSelectPreset = (presetId: (typeof NAMED_THEMES)[number]['id']) => {
    onChange(current => selectThemePreset(current, presetId));

    if (presetId === 'default' || presetId === 'legacy') {
      onThemeAssetsChange?.(themeAssetsForPreset(themeAssets, presetId));
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
    <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(18rem,28rem)_minmax(0,1fr)] xl:gap-8">
      <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-6">
        <div className="sticky top-0 z-20 bg-parchment pb-3">
          <ThemePreviewSection
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
            themeVars={themeVars}
            siteLogo={previewLogo}
            siteName={siteName}
            favicon={previewFavicon}
          />
        </div>
        <ThemePresetSection
          themeVars={themeVars}
          selectedPreset={selectedPreset}
          onSelectPreset={handleSelectPreset}
        />
        {children}
      </div>
      <ThemeColorsSection
        previewMode={previewMode}
        selectedPreset={selectedPreset}
        assetPreset={themeAssets?.preset}
        themeVars={themeVars}
        resolvedPreviewTheme={resolvedPreviewTheme}
        resolvedMergedPreview={resolvedMergedPreview}
        colorOptions={colorOptions}
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
