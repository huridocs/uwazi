import {
  applyCropDrag,
  contentBounds,
  currentTrimmedLogo,
  defaultOutputScale,
  logoDisplaySize,
  scaledCropSize,
} from '../logoFrame.js';

describe('logoFrame', () => {
  it('fits a wide wordmark to the header box', () => {
    expect(logoDisplaySize(2555, 580)).toEqual({
      width: 200,
      height: 200 * (580 / 2555),
    });
  });

  it('fits trimmed artwork to the header height', () => {
    expect(logoDisplaySize(305, 146)).toEqual({
      width: 305 * (48 / 146),
      height: 48,
    });
  });

  it('keeps the previous trim from covering a new logo', () => {
    const previous = { src: '/old.png', url: 'data:image/png;base64,old' };
    expect(currentTrimmedLogo('/new.png', previous)).toBe('/new.png');
    expect(currentTrimmedLogo('/old.png', previous)).toBe('data:image/png;base64,old');
    expect(currentTrimmedLogo(undefined, { src: undefined, url: '' })).toBe('');
  });

  it('drops empty margins around the artwork', () => {
    const pixels = new Uint8ClampedArray([
      0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255,
      255, 255, 255, 255, 255, 255, 0, 0, 0, 255,
    ]);
    expect(contentBounds(pixels, 4, 2)).toEqual({ x: 1, y: 0, width: 2, height: 2 });
  });

  it('caps square logos at the header height', () => {
    expect(logoDisplaySize(800, 800)).toEqual({ width: 48, height: 48 });
    expect(logoDisplaySize(40, 40)).toEqual({ width: 40, height: 40 });
  });

  it('lets the frame move past the image so the artwork can be centered', () => {
    expect(
      applyCropDrag({
        origin: { x: 10, y: 10, width: 40, height: 20 },
        mode: 'move',
        dx: -30,
        dy: 5,
        bounds: { width: 100, height: 80 },
      })
    ).toEqual({ x: -20, y: 15, width: 40, height: 20 });
  });

  it('grows the frame past the image and stops at twice its size', () => {
    expect(
      applyCropDrag({
        origin: { x: 0, y: 0, width: 100, height: 80 },
        mode: 'se',
        dx: 40,
        dy: 20,
        bounds: { width: 100, height: 80 },
      })
    ).toEqual({ x: 0, y: 0, width: 140, height: 100 });
    expect(
      applyCropDrag({
        origin: { x: 0, y: 0, width: 100, height: 80 },
        mode: 'se',
        dx: 500,
        dy: 500,
        bounds: { width: 100, height: 80 },
      })
    ).toEqual({ x: 0, y: 0, width: 200, height: 160 });
  });

  it('shrinks the saved file toward the recommended maximum', () => {
    const crop = { x: 0, y: 0, width: 1366, height: 350 };
    const scale = defaultOutputScale(crop);
    expect(scaledCropSize(crop, scale)).toEqual({ width: 800, height: 205 });
  });
});
