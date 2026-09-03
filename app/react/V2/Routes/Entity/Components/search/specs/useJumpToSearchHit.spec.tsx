/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { MemoryRouter, useLocation, type Location } from 'react-router';
import { tabGroupsAtom } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { focusMetadataFieldAtom } from '#V2/Components/Metadata/focusMetadataFieldAtom.js';
import { EntityUrlSync } from '../../../entityUrlState.js';
import { useJumpToSearchHit } from '../useJumpToSearchHit.js';

let mockTestStore: ReturnType<typeof createStore> | null = null;

jest.mock('#V2/Routes/Entity/Components/context/index.js', () => ({
  useEntityLanguage: () => ({
    mainDocument: { _id: '1', filename: 'file.pdf' },
  }),
}));

jest.mock('#V2/Routes/Entity/Tabs/EntityTabsContext.js', () => {
  const { mergeTabGroup, tabGroupsAtom: groupsAtom } =
    require('#V2/Components/UI/Tabs/tabsAtoms.js') as typeof import('#V2/Components/UI/Tabs/tabsAtoms.js');
  return {
    useEntityTabNavigation: () => ({
      stageSideTab: (sideTab: string) => {
        if (!mockTestStore) return;
        mockTestStore.set(groupsAtom, prev =>
          mergeTabGroup(prev, 'entity-side', { activeTabId: sideTab })
        );
      },
    }),
  };
});

describe('useJumpToSearchHit', () => {
  let store: ReturnType<typeof createStore>;
  let location: Location;

  const LocationProbe = () => {
    location = useLocation();
    return null;
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={['/?m=relationships#s=toc']}>
      <Provider store={store}>
        <EntityUrlSync>
          <LocationProbe />
          {children}
        </EntityUrlSync>
      </Provider>
    </MemoryRouter>
  );

  beforeEach(() => {
    store = createStore();
    mockTestStore = store;
  });

  it('jumpToProperty sets focus atom, main Metadata, and pins side Search', async () => {
    const { result } = renderHook(() => useJumpToSearchHit(), { wrapper });

    act(() => {
      result.current.jumpToProperty('metadata.description.value');
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(store.get(focusMetadataFieldAtom)).toEqual({ fieldKey: 'description' });
    expect(store.get(tabGroupsAtom)['entity-main']?.activeTabId).toBe('metadata');
    expect(store.get(tabGroupsAtom)['entity-side']?.activeTabId).toBe('search');
    expect(location.search).toContain('m=metadata');
    expect(location.hash).toContain('s=search');
    expect(location.hash).not.toContain('s=metadata');
  });

  it('ensureMainTab(Document) deletes m when a main document exists and pins Search', async () => {
    const { result } = renderHook(() => useJumpToSearchHit(), { wrapper });

    act(() => {
      result.current.ensureMainTab('document');
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(store.get(tabGroupsAtom)['entity-main']?.activeTabId).toBe('document');
    expect(store.get(tabGroupsAtom)['entity-side']?.activeTabId).toBe('search');
    expect(location.search).not.toContain('m=');
    expect(location.hash).toContain('s=search');
  });

  it('ensureMainTab(Document) applies optional hash patch in the same navigate', async () => {
    const { result } = renderHook(() => useJumpToSearchHit(), { wrapper });

    act(() => {
      result.current.ensureMainTab('document', {
        hash: next => {
          next.set('page', '4');
        },
      });
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(location.hash).toContain('page=4');
    expect(location.hash).toContain('s=search');
    expect(location.search).not.toContain('m=');
  });
});
