/**
 * @jest-environment jsdom
 */
import { resolveSideTabId } from '../Tabs/entityTabState.js';
import { SIDE_TAB } from '../Tabs/tabIds.js';

describe('resolveSideTabId', () => {
  const sideButtons = [
    { id: SIDE_TAB.METADATA },
    { id: SIDE_TAB.RELATIONSHIPS },
    { id: SIDE_TAB.FILES },
  ];

  it('returns the hash side tab when valid', () => {
    expect(resolveSideTabId(SIDE_TAB.RELATIONSHIPS, sideButtons)).toBe(SIDE_TAB.RELATIONSHIPS);
  });

  it('preserves the current side tab when hash is missing', () => {
    expect(resolveSideTabId(null, sideButtons, SIDE_TAB.RELATIONSHIPS)).toBe(
      SIDE_TAB.RELATIONSHIPS
    );
  });

  it('falls back to the first side tab when hash and current tab are missing', () => {
    expect(resolveSideTabId(null, sideButtons)).toBe(SIDE_TAB.METADATA);
  });
});
