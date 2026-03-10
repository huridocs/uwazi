import { mimeTypeFromUrl } from '../extensionHelper';

describe('mimeTypeFromUrl', () => {
  it('should return the correct mime type', () => {
    expect(mimeTypeFromUrl('https://example.com')).toBe('text/html');
    expect(mimeTypeFromUrl('https://example.es')).toBe('text/html');
    expect(mimeTypeFromUrl('https://example.com/images/cat.png')).toBe('image/png');
    expect(mimeTypeFromUrl('https://example.com/images/cat.png?r=200x400')).toBe('image/png');
    expect(mimeTypeFromUrl('https//example.com/images/meow.aac')).toBe('audio/x-aac');
    expect(mimeTypeFromUrl('https//example.com/images/meow')).toBe('text/html');
    expect(mimeTypeFromUrl('example.what')).toBe('text/html');
    expect(mimeTypeFromUrl('example.what/happycat.mpeg')).toBe('video/mpeg');
    expect(mimeTypeFromUrl('example.what/happycat.mpeg?r=200x400')).toBe('video/mpeg');
  });
});
