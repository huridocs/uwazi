import {
  applyCropDrag,
  contentBounds,
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

  it('moves and clamps a crop inside the image', () => {
    expect(
      applyCropDrag({
        origin: { x: 10, y: 10, width: 40, height: 20 },
        mode: 'move',
        dx: -30,
        dy: 5,
        bounds: { width: 100, height: 80 },
      })
    ).toEqual({ x: 0, y: 15, width: 40, height: 20 });
  });

  it('shrinks the saved file toward the recommended maximum', () => {
    const crop = { x: 0, y: 0, width: 1366, height: 350 };
    const scale = defaultOutputScale(crop);
    expect(scaledCropSize(crop, scale)).toEqual({ width: 800, height: 205 });
  });
});
