import {
  buildSimpleModeSemantics,
  recomputeSimpleThemeVarsFromAnchors,
  SIMPLE_SEMANTIC_ANCHOR_KEYS,
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
});
