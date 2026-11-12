/**
 * @jest-environment jsdom
 */
import React, { type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { tabGroupsAtom } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { MAIN_TAB, SIDE_TAB } from '#V2/Routes/Entity/Tabs/tabIds.js';
import { useLibraryPreviewTabs } from '../useLibraryPreviewTabs.js';

const mockUpdateEntityUrl = jest.fn();

jest.mock('#V2/Routes/Entity/entityUrlState.js', () => ({
  useUpdateEntityUrl: () => mockUpdateEntityUrl,
}));

describe('useLibraryPreviewTabs', () => {
  const store = createStore();
  let router = createMemoryRouter([{ path: '*', element: <div /> }], {
    initialEntries: ['/en/library'],
  });

  const wrapper = ({ children }: { children: ReactNode }) => {
    router = createMemoryRouter(
      [{ path: '*', element: <Provider store={store}>{children}</Provider> }],
      { initialEntries: ['/en/library'] }
    );
    return <RouterProvider router={router} />;
  };

  beforeEach(() => {
    mockUpdateEntityUrl.mockClear();
    store.set(tabGroupsAtom, {});
  });

  const activeMainTab = () => store.get(tabGroupsAtom)['entity-main']?.activeTabId;

  it('selects the table of contents on the library column', () => {
    const { result } = renderHook(() => useLibraryPreviewTabs(SIDE_TAB.METADATA), { wrapper });

    act(() => {
      result.current.focusSideTab(SIDE_TAB.TOC);
    });

    expect(activeMainTab()).toBe(SIDE_TAB.TOC);
    expect(router.state.location.pathname).toBe('/en/library');
    expect(router.state.location.search).not.toContain('m=');
    expect(router.state.location.search).not.toContain('s=');
    expect(mockUpdateEntityUrl).not.toHaveBeenCalled();
  });

  const openDocumentAtPage = (
    openSearchHit: ReturnType<typeof useLibraryPreviewTabs>['openSearchHit']
  ) => {
    act(() => {
      openSearchHit(MAIN_TAB.DOCUMENT, {
        hash: params => {
          params.set('page', '3');
        },
      });
    });
    const hash = new URLSearchParams();
    mockUpdateEntityUrl.mock.calls[0][0].hash(hash);
    expect(hash.get('page')).toBe('3');
  };

  it('selects the document or metadata when a search hit opens', () => {
    const { result } = renderHook(() => useLibraryPreviewTabs(SIDE_TAB.SEARCH), { wrapper });

    openDocumentAtPage(result.current.openSearchHit);
    expect(activeMainTab()).toBe(MAIN_TAB.DOCUMENT);

    mockUpdateEntityUrl.mockClear();
    act(() => {
      result.current.openSearchHit(MAIN_TAB.METADATA);
    });
    expect(activeMainTab()).toBe(MAIN_TAB.METADATA);
    expect(router.state.location.search).not.toContain('m=');
    expect(router.state.location.search).not.toContain('s=');
    expect(mockUpdateEntityUrl).not.toHaveBeenCalled();
  });

  it('selects relationships from the relationships action', () => {
    const { result } = renderHook(() => useLibraryPreviewTabs(SIDE_TAB.DOCUMENT), { wrapper });

    act(() => {
      result.current.focusRelationshipsPanel();
    });

    expect(activeMainTab()).toBe(MAIN_TAB.RELATIONSHIPS);
    expect(mockUpdateEntityUrl).not.toHaveBeenCalled();
  });
});
