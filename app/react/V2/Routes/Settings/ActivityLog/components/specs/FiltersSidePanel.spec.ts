import { clearedDateRange } from '../FiltersSidePanel.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: () => null,
  t: (_context: string, key: string) => key,
}));

describe('clearedDateRange', () => {
  it('clears one end and keeps the live sibling', () => {
    expect(clearedDateRange({ from: 222, to: 20 }, 'to')).toEqual({ from: 222, to: null });
    expect(clearedDateRange({ from: 222, to: 333 }, 'from')).toEqual({ from: null, to: 333 });
  });
});
