import { getThemeAsset, themeAssetPresetFromImport, themeAssetsForPreset } from '../themes.js';

describe('getThemeAsset site logo', () => {
  it('uses the collection name slot when no logo is selected', () => {
    expect(getThemeAsset({}, { __preset: 'legacy' }, 'light', 'siteLogo', '', true)).toBe('');
    expect(
      getThemeAsset(
        { siteLogo: { light: '' } },
        { __preset: 'default' },
        'light',
        'siteLogo',
        '',
        true
      )
    ).toBe('');
  });

  it('keeps a selected logo and the preset favicon', () => {
    expect(
      getThemeAsset(
        { siteLogo: { light: '/custom.svg' } },
        { __preset: 'default' },
        'light',
        'siteLogo',
        '',
        true
      )
    ).toBe('/custom.svg');
    expect(getThemeAsset({}, { __preset: 'default' }, 'light', 'favicon', '', true)).toBe(
      '/public/uwazi-design-icon-light.png'
    );
  });
});

describe('themeAssetPresetFromImport', () => {
  it('follows a named file id when stored assets are the other preset', () => {
    expect(themeAssetPresetFromImport({ preset: 'default' }, 'legacy')).toBe('legacy');
    expect(themeAssetPresetFromImport({ preset: 'legacy' }, 'default')).toBe('default');
  });

  it('keeps the current asset preset when the file id is custom', () => {
    expect(themeAssetPresetFromImport({ preset: 'legacy' }, 'custom')).toBe('legacy');
  });
});

describe('themeAssetsForPreset', () => {
  it('restores the preset logos when a named preset is chosen', () => {
    expect(themeAssetsForPreset({ siteLogo: { light: '' } }, 'legacy').siteLogo).toEqual({
      light: '/public/uwazi-theme-logo-light.svg',
      dark: '/public/uwazi-theme-logo-dark.svg',
    });
  });
});
