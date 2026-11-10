/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { entityWithRelations } from '../../../Components/relationships/specs/fixtures/entityWithRelations.js';
import { paneChoiceAtom, pendingLeftTabAtom, pendingSideTabAtom } from '../../entityTabState.js';
import { MAIN_TAB, SIDE_TAB } from '../../tabIds.js';
import { useEntityMainTabs } from '../useEntityMainTabs.js';

let mockMainParam = '';

jest.mock('../../../entityUrlState', () => ({
  useEntitySearchParams: () => new URLSearchParams(mockMainParam),
  useEntityHashUiParams: () => new URLSearchParams(),
  useUpdateEntityUrl: () => jest.fn(),
}));

jest.mock('../useEntitySideButtonModel', () => ({
  useEntitySideButtonModel: () => ({
    catalogFor: () => [],
  }),
}));

describe('useEntityMainTabs side pane', () => {
  beforeEach(() => {
    mockMainParam = '';
    const store = getDefaultStore();
    store.set(pendingLeftTabAtom, null);
    store.set(pendingSideTabAtom, null);
    store.set(paneChoiceAtom, null);
  });

  it('requests the side pane without changing the side tab', () => {
    const { result } = renderHook(() =>
      useEntityMainTabs({
        entity: entityWithRelations,
        hasMainDocument: true,
        filesSideTabs: { showTranslationsTab: false, translationsCount: 0 },
      })
    );

    act(() => {
      result.current.showSidePane();
    });

    expect(result.current.requestedPane).toEqual({ index: 1, id: 1 });
  });

  it('keeps ToC on the page instead of opening the side sheet', () => {
    const { result } = renderHook(() =>
      useEntityMainTabs({
        entity: entityWithRelations,
        hasMainDocument: true,
        filesSideTabs: { showTranslationsTab: false, translationsCount: 0 },
      })
    );

    act(() => {
      result.current.onMainTabChange(SIDE_TAB.TOC);
    });

    expect(result.current.activeMainTab).toBe(SIDE_TAB.TOC);
    expect(result.current.requestedPane).toBeUndefined();
  });

  it('leaves the side sheet closed when a subject tab is chosen on the left', () => {
    const { result } = renderHook(() =>
      useEntityMainTabs({
        entity: entityWithRelations,
        hasMainDocument: true,
        filesSideTabs: { showTranslationsTab: false, translationsCount: 0 },
      })
    );

    act(() => {
      result.current.onMainTabChange(MAIN_TAB.METADATA);
    });

    expect(result.current.requestedPane).toBeUndefined();
  });

  it('opens the side sheet when a search hit leaves Search on the left', () => {
    mockMainParam = 'm=search';
    const { result } = renderHook(() =>
      useEntityMainTabs({
        entity: entityWithRelations,
        hasMainDocument: true,
        filesSideTabs: { showTranslationsTab: false, translationsCount: 0 },
      })
    );

    act(() => {
      result.current.openSearchHit(MAIN_TAB.DOCUMENT);
    });

    expect(result.current.activeMainTab).toBe(SIDE_TAB.SEARCH);
    expect(result.current.requestedPane).toEqual({ index: 1, id: 1 });
  });
});
