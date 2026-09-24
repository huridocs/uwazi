import {
  DEFAULT_THUMB_FIT,
  DEFAULT_THUMB_FRAME,
  DEFAULT_THUMB_SIZE,
  imageIsMatted,
  LANDSCAPE_CARD_FLOOR_CLASS,
  LANDSCAPE_THUMB_HEIGHT_CLASS,
  PORTRAIT_CARD_GRID_CLASS,
  thumbnailFitFromStyle,
} from '../libraryCardDisplay.js';

describe('thumbnail size', () => {
  it('copies the uwazi-design small, medium and large slot sizes', () => {
    expect(DEFAULT_THUMB_SIZE).toBe('s');
    expect(LANDSCAPE_THUMB_HEIGHT_CLASS).toEqual({
      s: 'h-[3.75rem]',
      m: 'h-36',
      l: 'h-48',
    });
    expect(LANDSCAPE_CARD_FLOOR_CLASS).toEqual({
      s: 'min-h-[13.25rem]',
      m: 'min-h-[18.5rem]',
      l: 'min-h-[21.5rem]',
    });
    expect(PORTRAIT_CARD_GRID_CLASS).toEqual({
      s: 'grid-cols-2 sm:grid-cols-4 xl:grid-cols-5',
      m: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
      l: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
    });
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
