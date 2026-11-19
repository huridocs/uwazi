import {
  getThemeAsset,
  themeAssetPresetFromImport,
  themeAssetsForPreset,
  themeAssetsFromImport,
} from '../themes.js';

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

  it('uses the file logo preset when the color id is the other preset', () => {
    expect(themeAssetPresetFromImport({ preset: 'default' }, 'default', 'legacy')).toBe('legacy');
  });
});

describe('themeAssetsFromImport', () => {
  it('replaces stored logos when the file names a logo preset', () => {
    const next = themeAssetsFromImport(
      { preset: 'default', siteLogo: { light: '/old.svg' }, favicon: { light: '/old.ico' } },
      'default',
      'legacy'
    );
    expect(next.preset).toBe('legacy');
    expect(next.siteLogo).toEqual({
      light: '/public/uwazi-theme-logo-light.svg',
      dark: '/public/uwazi-theme-logo-dark.svg',
    });
    expect(getThemeAsset(next, { __preset: 'custom' }, 'light', 'favicon', '', true)).toBe(
      '/public/favicon.ico'
    );
  });

  it('keeps uploaded logos when the file id is custom', () => {
    const next = themeAssetsFromImport(
      { preset: 'legacy', siteLogo: { light: '/mine.svg' } },
      'custom'
    );
    expect(next.preset).toBe('legacy');
    expect(next.siteLogo).toEqual({ light: '/mine.svg' });
  });

  it('keeps an uploaded logo when a custom file repeats the current logo preset', () => {
    const next = themeAssetsFromImport(
      { preset: 'default', siteLogo: { light: '/mine.svg' }, favicon: { light: '/mine.ico' } },
      'custom',
      'default'
    );
    expect(next.siteLogo).toEqual({ light: '/mine.svg' });
    expect(getThemeAsset(next, { __preset: 'custom' }, 'light', 'favicon', '', true)).toBe(
      '/mine.ico'
    );
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
