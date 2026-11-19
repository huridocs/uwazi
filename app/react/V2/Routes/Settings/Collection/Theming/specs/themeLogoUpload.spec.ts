/**
 * @jest-environment jsdom
 */
import { FileType } from '#shared/types/fileType.js';
import { namedThemeUpload, themeAssetUploadsToRemove } from '../themeLogoUpload.js';

const file = (originalname: string, filename: string, id: string): FileType => ({
  _id: id,
  originalname,
  filename,
  type: 'custom',
});

describe('namedThemeUpload', () => {
  it('keeps the mode and extension for a favicon', () => {
    const named = namedThemeUpload(new File(['x'], 'icon.ICO', { type: 'image/x-icon' }), {
      kind: 'favicon',
      mode: 'dark',
    });
    expect(named.name).toBe('uwazi-theme-favicon-dark.ico');
  });
});

describe('themeAssetUploadsToRemove', () => {
  it('keeps the saved light and dark logo and favicon, and drops older copies', () => {
    const files = [
      file('uwazi-theme-logo-light.png', '111.png', 'old-logo'),
      file('uwazi-theme-logo-light.png', '222.png', 'logo'),
      file('uwazi-theme-logo.png', 'legacy.png', 'legacy'),
      file('uwazi-theme-logo-dark.png', '444.png', 'dark-logo'),
      file('uwazi-theme-logo-dark.png', '555.png', 'old-dark-logo'),
      file('uwazi-theme-favicon-light.png', 'fav.png', 'favicon'),
      file('uwazi-theme-favicon-light.ico', 'old.ico', 'old-favicon'),
      file('photo.png', '333.png', 'other'),
    ];
    expect(
      themeAssetUploadsToRemove(files, {
        siteLogo: { light: '/assets/222.png', dark: '/assets/444.png' },
        favicon: { light: '/assets/fav.png' },
      })
    ).toEqual(['old-logo', 'legacy', 'old-dark-logo', 'old-favicon']);
  });

  it('drops reserved uploads when the saved images are not those files', () => {
    const files = [
      file('uwazi-theme-logo-light.png', '111.png', 'logo'),
      file('uwazi-theme-favicon-dark.png', 'fav.png', 'favicon'),
    ];
    expect(
      themeAssetUploadsToRemove(files, {
        siteLogo: { light: '/public/uwazi-design-logo.svg' },
        favicon: { light: '/public/favicon.ico' },
      })
    ).toEqual(['logo', 'favicon']);
  });
});
