import { mixHex } from '#shared/utils/contrast.js';
import { PRESET_DEFINITIONS, SEMANTIC_VAR_KEYS, THEME_MODES } from './tokens.js';
import { normalizeHex } from './themePaletteSort.js';
import type {
  EditableThemeVars,
  SemanticVarKey,
  ThemeMode,
  ThemePresetId,
  ResolvedThemeVars,
} from './tokens.js';

const THEME_EDITOR_MODE_KEY = '__themeEditorMode' as const;

const SIMPLE_SEMANTIC_ANCHOR_KEYS = [
  '--color-theme-accent-primary',
  '--color-theme-accent-supporting',
  '--color-theme-accent-emphasis',
  '--color-theme-bg-primary',
  '--color-theme-bg-surface',
  '--color-theme-text-primary',
  '--color-theme-border-primary',
] as const satisfies readonly SemanticVarKey[];

type SimpleSemanticAnchorKey = (typeof SIMPLE_SEMANTIC_ANCHOR_KEYS)[number];

const deriveBgMuted = (surface: string, primary: string) => {
  if (normalizeHex(surface) === normalizeHex(primary)) {
    return mixHex(surface, '#64748B', 0.07);
  }
  return mixHex(surface, primary, 0.42);
};

const deriveTextMutedStep = (textPrimary: string, surface: string, weight: number) =>
  mixHex(textPrimary, surface, weight);

const buildSimpleModeSemantics = (
  presetId: ThemePresetId,
  mode: ThemeMode,
  anchors: Record<SimpleSemanticAnchorKey, string>
): EditableThemeVars => {
  const base = { ...PRESET_DEFINITIONS[presetId].sourceModes[mode] };
  const merged: EditableThemeVars = { ...base, ...anchors };
  const surface = merged['--color-theme-bg-surface'];
  const primary = merged['--color-theme-bg-primary'];
  const textPrimary = merged['--color-theme-text-primary'];
  merged['--color-theme-bg-muted'] = deriveBgMuted(surface, primary);
  merged['--color-theme-text-secondary'] = deriveTextMutedStep(textPrimary, surface, 0.22);
  merged['--color-theme-text-tertiary'] = deriveTextMutedStep(textPrimary, surface, 0.42);
  merged['--color-theme-text-muted'] = deriveTextMutedStep(textPrimary, surface, 0.62);
  return merged;
};

const themeStorageKey = (mode: ThemeMode, key: string) => `${mode}:${key}`;

const recomputeSimpleThemeVarsFromAnchors = (
  themeVars: Record<string, string | undefined>,
  basePreset: ThemePresetId,
  getResolved: (mode: ThemeMode) => ResolvedThemeVars
): Record<string, string | undefined> => {
  const next: Record<string, string | undefined> = {
    ...themeVars,
    [THEME_EDITOR_MODE_KEY]: 'simple',
  };
  for (const mode of THEME_MODES) {
    const resolved = getResolved(mode);
    const anchors = Object.fromEntries(
      SIMPLE_SEMANTIC_ANCHOR_KEYS.map(k => [k, themeVars[themeStorageKey(mode, k)] ?? resolved[k]])
    ) as Record<SimpleSemanticAnchorKey, string>;
    const semantics = buildSimpleModeSemantics(basePreset, mode, anchors);
    for (const sk of SEMANTIC_VAR_KEYS) {
      next[themeStorageKey(mode, sk)] = semantics[sk];
    }
  }
  return next;
};

const applySimpleModeSemanticsForMode = (
  themeVars: Record<string, string | undefined>,
  mode: ThemeMode,
  basePreset: ThemePresetId,
  anchorPatch: Partial<Record<SimpleSemanticAnchorKey, string>>,
  getResolved: (mode: ThemeMode) => ResolvedThemeVars
): Record<string, string | undefined> => {
  const resolved = getResolved(mode);
  const anchors = Object.fromEntries(
    SIMPLE_SEMANTIC_ANCHOR_KEYS.map(k => [
      k,
      k in anchorPatch ? anchorPatch[k]! : (themeVars[themeStorageKey(mode, k)] ?? resolved[k]),
    ])
  ) as Record<SimpleSemanticAnchorKey, string>;
  const semantics = buildSimpleModeSemantics(basePreset, mode, anchors);
  const next: Record<string, string | undefined> = {
    ...themeVars,
    [THEME_EDITOR_MODE_KEY]: 'simple',
  };
  for (const sk of SEMANTIC_VAR_KEYS) {
    next[themeStorageKey(mode, sk)] = semantics[sk];
  }
  return next;
};

export {
  THEME_EDITOR_MODE_KEY,
  SIMPLE_SEMANTIC_ANCHOR_KEYS,
  buildSimpleModeSemantics,
  recomputeSimpleThemeVarsFromAnchors,
  applySimpleModeSemanticsForMode,
};
export type { SimpleSemanticAnchorKey };
