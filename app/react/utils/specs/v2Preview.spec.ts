import { applyV2Preview, previewThemeCustomization } from '../v2Preview.js';

const tenantSettings = {
  site_name: 'Uwazi',
  themeCustomization: false,
  features: {
    newHeader: false,
    featureFlagLibraryV2: false,
    featureFlagEntityViewerv2: false,
    themeCustomization: false,
    paragraphExtraction: true,
    aiAssistant: false,
  },
};

describe('applyV2Preview', () => {
  it('turns UI V2 flags on for ?v2, ?v2=1, and ?v2=true', () => {
    ['?v2', '?v2=1', '?v2=true'].forEach(search => {
      const result = applyV2Preview(tenantSettings, { search });
      expect(result.settings.themeCustomization).toBe(true);
      expect(result.settings.features).toEqual({
        newHeader: true,
        featureFlagLibraryV2: true,
        featureFlagEntityViewerv2: true,
        themeCustomization: true,
        paragraphExtraction: true,
        aiAssistant: false,
      });
      expect(result.setCookie).toBe('uwazi_v2_preview=1; Path=/; SameSite=Lax; HttpOnly');
    });
  });

  it('keeps tenant flags and clears the cookie for ?v2=0 and ?v2=false', () => {
    ['?v2=0', '?v2=false'].forEach(search => {
      const result = applyV2Preview(
        {
          ...tenantSettings,
          themeCustomization: true,
          features: { ...tenantSettings.features, newHeader: true },
        },
        { search, cookieHeader: 'uwazi_v2_preview=1' }
      );
      expect(result.settings.themeCustomization).toBe(true);
      expect(result.settings.features?.newHeader).toBe(true);
      expect(result.settings.features?.featureFlagLibraryV2).toBe(false);
      expect(result.setCookie).toBe('uwazi_v2_preview=; Path=/; SameSite=Lax; HttpOnly; Max-Age=0');
    });
  });

  it('follows the cookie when the query is absent', () => {
    const on = applyV2Preview(tenantSettings, {
      search: '',
      cookieHeader: 'locale=en; uwazi_v2_preview=1',
    });
    expect(on.settings.features?.featureFlagEntityViewerv2).toBe(true);
    expect(on.setCookie).toBeUndefined();

    const off = applyV2Preview(tenantSettings, { search: '?search=foo' });
    expect(off.settings).toBe(tenantSettings);
    expect(off.setCookie).toBeUndefined();
  });

  it('lets the query override the cookie', () => {
    const result = applyV2Preview(tenantSettings, {
      search: '?v2=0',
      cookieHeader: 'uwazi_v2_preview=1',
    });
    expect(result.settings.features?.featureFlagLibraryV2).toBe(false);
    expect(result.setCookie).toContain('Max-Age=0');
  });

  it('turns collection theme customization on for the preview cookie without clearing a tenant flag', () => {
    expect(
      previewThemeCustomization(false, { search: '', cookieHeader: 'uwazi_v2_preview=1' })
    ).toBe(true);
    expect(previewThemeCustomization(false, { search: '?v2=1' })).toBe(true);
    expect(
      previewThemeCustomization(true, { search: '?v2=0', cookieHeader: 'uwazi_v2_preview=1' })
    ).toBe(true);
    expect(previewThemeCustomization(false, { search: '' })).toBe(false);
    expect(
      previewThemeCustomization(false, {
        search: '?v2=0',
        cookieHeader: 'uwazi_v2_preview=1',
      })
    ).toBe(false);
  });

  it('ignores an unknown v2 value and falls through to the cookie', () => {
    const fromCookie = applyV2Preview(tenantSettings, {
      search: '?v2=banana',
      cookieHeader: 'uwazi_v2_preview=1',
    });
    expect(fromCookie.settings.features?.newHeader).toBe(true);
    expect(fromCookie.setCookie).toBeUndefined();

    const unchanged = applyV2Preview(tenantSettings, { search: '?v2=banana' });
    expect(unchanged.settings).toBe(tenantSettings);
    expect(unchanged.setCookie).toBeUndefined();
  });
});
