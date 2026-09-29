import { tableMinWidthRem } from '../tableMinWidthRem.js';

describe('tableMinWidthRem', () => {
  it('sums fixed rem tracks plus gaps and padding', () => {
    expect(
      tableMinWidthRem([
        { id: 'a', header: 'A', cell: () => null, width: '10rem' },
        { id: 'b', header: 'B', cell: () => null, width: '6rem' },
      ])
    ).toBe(10 + 6 + 0.75 + 2);
  });

  it('uses the minmax minimum so flexible tracks still scroll when needed', () => {
    expect(
      tableMinWidthRem([
        { id: 'title', header: 'Title', cell: () => null, width: 'minmax(16rem, 3fr)' },
        { id: 'country', header: 'Country', cell: () => null, width: 'minmax(8rem, 1fr)' },
      ])
    ).toBe(16 + 8 + 0.75 + 2);
  });
});
