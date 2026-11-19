import type { FileType } from '#shared/types/fileType.js';
import { UWAZI_DEFAULT_FAVICONS, UWAZI_DEFAULT_LOGOS } from '../builtinBrandImages.js';
import { galleryImages } from '../customUploadImagePickerLib.js';

describe('galleryImages', () => {
  it('lists Uwazi defaults before uploads and skips a duplicate url', () => {
    const uploaded: FileType[] = [
      { url: '/public/uwazi-design-logo.svg', filename: 'dup.svg', mimetype: 'image/svg+xml' },
      { url: '/assets/mine.png', filename: 'mine.png', mimetype: 'image/png' },
      { filename: 'notes.txt', mimetype: 'text/plain' },
    ];
    expect(galleryImages(UWAZI_DEFAULT_LOGOS, uploaded).map(file => file.url)).toEqual([
      '/public/uwazi-design-logo.svg',
      '/public/uwazi-theme-logo-light.svg',
      '/public/uwazi-theme-logo-dark.svg',
      '/assets/mine.png',
    ]);
  });

  it('offers the Uwazi Design favicon', () => {
    expect(UWAZI_DEFAULT_FAVICONS.map(file => file.url)).toEqual([
      '/public/uwazi-design-icon-light.png',
      '/public/favicon.ico',
    ]);
  });
});
