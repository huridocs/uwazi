import {
  DEFAULT_THUMB_FIT,
  DEFAULT_THUMB_FRAME,
  imageIsMatted,
  LANDSCAPE_THUMB_HEIGHT_PX,
  landscapeThumbHeightClass,
  thumbnailFitFromStyle,
} from '../libraryCardDisplay.js';

describe('landscape thumbnail height', () => {
  it('matches the 142px uwazi-design landscape media header', () => {
    expect(LANDSCAPE_THUMB_HEIGHT_PX).toBe(142);
    expect(landscapeThumbHeightClass).toBe('h-[142px]');
  });
});

describe('default thumbnail frame', () => {
  it('defaults to portrait when no display param is set', () => {
    expect(DEFAULT_THUMB_FRAME).toBe('portrait');
  });
});

describe('imageIsMatted', () => {
  it('mats every image under contain and none under cover', () => {
    expect(imageIsMatted('contain')).toBe(true);
    expect(imageIsMatted('cover')).toBe(false);
  });
});

describe('thumbnailFitFromStyle', () => {
  it('reads cover vs contain from the template image property style', () => {
    expect(thumbnailFitFromStyle('contain')).toBe('contain');
    expect(thumbnailFitFromStyle('cover')).toBe('cover');
    expect(thumbnailFitFromStyle(undefined)).toBe('cover');
    expect(thumbnailFitFromStyle('fill')).toBe('cover');
  });

  it('defaults the card thumbnail fit to cover, matching template image fields', () => {
    expect(DEFAULT_THUMB_FIT).toBe('cover');
  });
});
