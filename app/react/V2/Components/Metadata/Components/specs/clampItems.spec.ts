import { clampItems } from '../clampItems.js';

const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'];

describe('clampItems', () => {
  it('shows the first ten until expanded', () => {
    expect(clampItems(items, false)).toEqual({
      shown: items.slice(0, 10),
      overflows: true,
    });
    expect(clampItems(items, true)).toEqual({ shown: items, overflows: true });
  });

  it('keeps a short list intact', () => {
    const short = items.slice(0, 10);
    expect(clampItems(short, false)).toEqual({ shown: short, overflows: false });
  });
});
