/**
 * @jest-environment jsdom
 */
import { entityViewTab, resolveActiveSideTab, resolveSideTabId } from '../Tabs/entityTabState.js';
import { MAIN_TAB, SIDE_TAB } from '../Tabs/tabIds.js';

describe('entityViewTab', () => {
  it('uses a search or contents left tab as the view id', () => {
    expect(entityViewTab(SIDE_TAB.SEARCH, MAIN_TAB.DOCUMENT)).toBe(SIDE_TAB.SEARCH);
    expect(entityViewTab(SIDE_TAB.TOC, MAIN_TAB.DOCUMENT)).toBe(SIDE_TAB.TOC);
  });

  it('keeps the resolved main tab when the url has no companion tab', () => {
    expect(entityViewTab(null, MAIN_TAB.DOCUMENT)).toBe(MAIN_TAB.DOCUMENT);
    expect(entityViewTab(MAIN_TAB.METADATA, MAIN_TAB.METADATA)).toBe(MAIN_TAB.METADATA);
  });
});

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

  it('ignores a pending side tab that the current buttons do not show', () => {
    expect(
      resolveActiveSideTab({
        pending: SIDE_TAB.SEARCH,
        sideButtons,
        explicit: SIDE_TAB.METADATA,
        atomSideTab: SIDE_TAB.FILES,
      })
    ).toEqual({ active: SIDE_TAB.METADATA, sync: SIDE_TAB.METADATA });
  });

  it('keeps a pending side tab that the current buttons show', () => {
    expect(
      resolveActiveSideTab({
        pending: SIDE_TAB.FILES,
        sideButtons,
        explicit: SIDE_TAB.METADATA,
        atomSideTab: SIDE_TAB.METADATA,
      })
    ).toEqual({ active: SIDE_TAB.FILES, sync: SIDE_TAB.FILES });
  });
});
