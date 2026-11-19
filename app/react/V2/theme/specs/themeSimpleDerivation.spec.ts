import { checkContrast } from '#shared/utils/contrast.js';
import {
  buildSimpleModeSemantics,
  recomputeSimpleThemeVarsFromAnchors,
  simpleBasePreset,
  SIMPLE_SEMANTIC_ANCHOR_KEYS,
  simpleChromeFromBar,
  type SimpleSemanticAnchorKey,
} from '#V2/theme/themeSimpleDerivation.js';
import { appliedTheme } from '#V2/theme/themes.js';
import { PRESET_DEFINITIONS } from '#V2/theme/tokens.js';

describe('themeSimpleDerivation', () => {
  it('keeps success and warning from preset base while deriving muted and text steps', () => {
    const src = PRESET_DEFINITIONS.default.sourceModes.light;
    const anchors = Object.fromEntries(SIMPLE_SEMANTIC_ANCHOR_KEYS.map(k => [k, src[k]])) as Record<
      SimpleSemanticAnchorKey,
      string
    >;
    const out = buildSimpleModeSemantics('default', 'light', anchors);
    expect(out['--color-theme-success']).toBe(src['--color-theme-success']);
    expect(out['--color-theme-warning']).toBe(src['--color-theme-warning']);
    expect(out['--color-theme-bg-muted']).not.toBe(src['--color-theme-bg-muted']);
    expect(out['--color-theme-text-secondary']).not.toBe(out['--color-theme-text-primary']);
  });

  it('recomputeSimpleThemeVarsFromAnchors sets editor mode and per-mode semantic storage keys', () => {
    const base = { __preset: 'default' as const };
    const next = recomputeSimpleThemeVarsFromAnchors(base, 'default', m =>
      appliedTheme(base, m, true)
    );
    expect(next.__themeEditorMode).toBe('simple');
    expect(next['light:--color-theme-text-secondary']).toBeDefined();
    expect(next['dark:--color-theme-text-secondary']).toBeDefined();
  });

  it('uses the legacy preset for a custom theme whose assets are legacy', () => {
    const themeVars = { __preset: 'custom' as const };
    const base = simpleBasePreset('custom', 'legacy');
    const next = recomputeSimpleThemeVarsFromAnchors(themeVars, base, mode =>
      appliedTheme({ ...themeVars, __preset: base }, mode, true)
    );
    expect(base).toBe('legacy');
    expect(next['light:--color-theme-bg-primary']).toBe(
      PRESET_DEFINITIONS.legacy.sourceModes.light['--color-theme-bg-primary']
    );
    expect(simpleBasePreset('custom', 'default')).toBe('default');
    expect(simpleBasePreset('custom', undefined)).toBe('default');
    expect(simpleBasePreset('custom', 'default', 'legacy')).toBe('legacy');
    expect(simpleBasePreset('custom', 'legacy', 'default')).toBe('default');
  });

  it('derives header text and button fill when the simple bar changes', () => {
    const next = simpleChromeFromBar(
      { 'light:--color-theme-chrome-settings-rail-bg': '#111111' },
      'light',
      '#FFFFFF'
    );
    const bar = next['light:--color-theme-chrome-app-bar'];
    const text = next['light:--color-theme-chrome-app-bar-fg'];
    const buttons = next['light:--color-theme-chrome-app-bar-hover'];
    expect(bar).toBe('#FFFFFF');
    expect(text).toBeDefined();
    expect(buttons).toBeDefined();
    expect(checkContrast(bar ?? '#000000', text ?? '#000000').passesAA).toBe(true);
    expect(checkContrast(buttons ?? '#000000', text ?? '#000000').passesAA).toBe(true);
    expect(next['light:--color-theme-chrome-settings-rail-bg']).toBe('#111111');
  });
});
