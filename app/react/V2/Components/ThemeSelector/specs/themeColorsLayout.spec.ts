import { themeColorsStartOpen } from '../themeColorsLayout.js';

describe('themeColorsStartOpen', () => {
  it('starts collapsed under the large breakpoint and open from it', () => {
    expect(themeColorsStartOpen(1023)).toBe(false);
    expect(themeColorsStartOpen(1024)).toBe(true);
    expect(themeColorsStartOpen(1279)).toBe(true);
  });
});
