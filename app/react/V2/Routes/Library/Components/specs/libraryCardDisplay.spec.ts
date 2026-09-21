import { imageAspect, imageIsMatted } from '../libraryCardDisplay.js';

describe('imageAspect', () => {
  it('classifies wide, tall and square images', () => {
    expect(imageAspect(1200, 800)).toBe('landscape');
    expect(imageAspect(800, 1200)).toBe('portrait');
    expect(imageAspect(800, 800)).toBe('square');
  });
});

describe('imageIsMatted', () => {
  it('mats every image under contain and none under cover', () => {
    expect(imageIsMatted('contain', 'landscape', 'landscape')).toBe(true);
    expect(imageIsMatted('cover', 'landscape', 'portrait')).toBe(false);
  });

  it('under auto, mats when the image does not match the frame', () => {
    expect(imageIsMatted('auto', 'landscape', 'landscape')).toBe(false);
    expect(imageIsMatted('auto', 'landscape', 'portrait')).toBe(true);
    expect(imageIsMatted('auto', 'portrait', 'portrait')).toBe(false);
    expect(imageIsMatted('auto', 'landscape', 'square')).toBe(true);
    expect(imageIsMatted('auto', 'landscape')).toBe(true);
  });
});
