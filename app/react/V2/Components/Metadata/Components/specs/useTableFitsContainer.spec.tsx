/**
 * @jest-environment jsdom
 */
import { connectionLayout } from '../useTableFitsContainer.js';

describe('connectionLayout', () => {
  it('keeps a compact table once the card is at least 28.5rem', () => {
    expect(connectionLayout(716, 700, 32)).toBe('table');
    expect(connectionLayout(456, 450, 40)).toBe('table');
  });

  it('stacks cards when the card is narrower than 28.5rem', () => {
    expect(connectionLayout(455, 400, 32)).toBe('stack');
    expect(connectionLayout(400, 800, 200)).toBe('stack');
  });

  it('uses one row of property cards when a wide table cannot hold the content', () => {
    expect(connectionLayout(791, 791, 180)).toBe('properties');
    expect(connectionLayout(791, 1100, 40)).toBe('properties');
  });

  it('keeps the table before the card has been measured', () => {
    expect(connectionLayout(0, 0, 0)).toBe('table');
  });
});
