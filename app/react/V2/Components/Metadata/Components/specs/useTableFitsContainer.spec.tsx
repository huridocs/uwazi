/**
 * @jest-environment jsdom
 */
import { connectionLayout } from '../useTableFitsContainer.js';

describe('connectionLayout', () => {
  it('uses a table when the field is at least 28.5rem wide', () => {
    expect(connectionLayout(791)).toBe('table');
    expect(connectionLayout(716)).toBe('table');
    expect(connectionLayout(456)).toBe('table');
  });

  it('uses cards when the field is narrower than 28.5rem', () => {
    expect(connectionLayout(455)).toBe('stack');
    expect(connectionLayout(400)).toBe('stack');
  });

  it('uses a table when the field width is zero', () => {
    expect(connectionLayout(0)).toBe('table');
  });
});
