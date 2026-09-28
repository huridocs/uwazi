import { mergeLineRectangles } from '../mergeLineRectangles.js';

describe('mergeLineRectangles', () => {
  it('joins rectangles that sit on the same line even when there is a word gap', () => {
    expect(
      mergeLineRectangles([
        { left: 10, top: 20, width: 40, height: 12, regionId: '1' },
        { left: 58, top: 21, width: 30, height: 11, regionId: '1' },
      ])
    ).toEqual([{ left: 10, top: 20, width: 78, height: 12, regionId: '1' }]);
  });

  it('keeps different lines and pages as separate rectangles', () => {
    expect(
      mergeLineRectangles([
        { left: 10, top: 20, width: 40, height: 12, regionId: '1' },
        { left: 10, top: 40, width: 50, height: 12, regionId: '1' },
        { left: 10, top: 20, width: 40, height: 12, regionId: '2' },
      ])
    ).toEqual([
      { left: 10, top: 20, width: 40, height: 12, regionId: '1' },
      { left: 10, top: 40, width: 50, height: 12, regionId: '1' },
      { left: 10, top: 20, width: 40, height: 12, regionId: '2' },
    ]);
  });
});
