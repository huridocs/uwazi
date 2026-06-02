import { BUTTON_PRIMARY_BG, EMPHASIS_SOLID_BG, EMPHASIS_SOLID_FG } from '#V2/theme/roleTokens.js';
import { getScopedThemeVars } from '#V2/theme/themeScopedVars.js';
import { appliedTheme } from '#V2/theme/themes.js';
import type { ResolvedThemeVars } from '#V2/theme/themes.js';

describe('getScopedThemeVars merge contract', () => {
  const baseResolved = (): ResolvedThemeVars => appliedTheme(undefined, 'light', true);

  it('maps role-level surface page from bg-primary even if resolved carried a stale surface-page key', () => {
    const resolved = {
      ...baseResolved(),
      '--color-theme-surface-page': '#ff00ff',
    } as ResolvedThemeVars;
    const scoped = getScopedThemeVars('default', resolved);
    expect(scoped['--color-theme-surface-page']).toBe(resolved['--color-theme-bg-primary']);
    expect(scoped['--color-theme-surface-page']).not.toBe('#ff00ff');
  });

  it('lets the button layer override resolved when both set the same button token', () => {
    const resolved = {
      ...baseResolved(),
      [BUTTON_PRIMARY_BG]: '#ff00ff',
    } as ResolvedThemeVars;
    const scoped = getScopedThemeVars('default', resolved);
    expect(scoped[BUTTON_PRIMARY_BG]).toBe(resolved['--color-theme-accent-primary']);
    expect(scoped[BUTTON_PRIMARY_BG]).not.toBe('#ff00ff');
  });

  it('exposes compatibility aliases that mirror canonical resolved keys', () => {
    const resolved = baseResolved();
    const scoped = getScopedThemeVars('default', resolved);
    expect(scoped['--text-primary']).toBe(resolved['--color-theme-text-primary']);
    expect(scoped['--bg-primary']).toBe(resolved['--color-theme-bg-primary']);
  });

  it('adds component tokens not present on resolved alone', () => {
    const resolved = baseResolved();
    expect(Object.hasOwn(resolved as object, BUTTON_PRIMARY_BG)).toBe(false);
    const scoped = getScopedThemeVars('default', resolved);
    expect(scoped[BUTTON_PRIMARY_BG]).toBe(resolved['--color-theme-accent-primary']);
  });

  it('adds emphasis solid pair derived from feedback danger', () => {
    const resolved = baseResolved();
    const scoped = getScopedThemeVars('default', resolved);
    expect(scoped[EMPHASIS_SOLID_BG].startsWith('#')).toBe(true);
    expect(scoped[EMPHASIS_SOLID_FG].startsWith('#')).toBe(true);
  });
});
