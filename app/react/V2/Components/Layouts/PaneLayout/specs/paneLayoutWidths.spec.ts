import { MIN_PANE_WIDTH_PX, paneWidthsFromRatios } from '../paneLayoutWidths';

describe('paneWidthsFromRatios', () => {
  it('clamps each pane to the min width before two media cards would share a row', () => {
    expect(MIN_PANE_WIDTH_PX).toBe(320);
    expect(MIN_PANE_WIDTH_PX).toBeLessThan(288 * 2 + 12);
    expect(paneWidthsFromRatios([0.25, 0.75], 1600)).toEqual([400, 1200]);
  });

  it('scales panes when mins would overflow the container', () => {
    const widths = paneWidthsFromRatios([0.2, 0.2, 0.6], 1229);
    expect(widths[0]).toBeCloseTo(283.66, 1);
    expect(widths[1]).toBeCloseTo(283.66, 1);
    expect(widths[2]).toBeCloseTo(653.67, 1);
  });
});
