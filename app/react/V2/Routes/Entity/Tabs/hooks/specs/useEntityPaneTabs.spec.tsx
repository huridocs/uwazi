/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import {
  MemoryRouter,
  useLocation,
  useNavigate,
  type Location,
  type NavigateFunction,
} from 'react-router';
import { EntityUrlSync } from '../../../entityUrlState.js';
import { entityPageAtom } from '../../../entityUrlAtoms.js';
import { pendingLeftTabAtom, pendingSideTabAtom } from '../../entityTabState.js';
import { entityWithRelations } from '../../../Components/relationships/specs/fixtures/entityWithRelations.js';
import { MAIN_TAB, SIDE_TAB } from '../../tabIds.js';
import { useEntityPaneTabs } from '../useEntityPaneTabs.js';

jest.mock('../../../Components/EntityPageView/EntityPageViewContext.tsx', () => ({
  useEntityPageView: () => ({ hasEntityPageView: false }),
}));

jest.mock('../useEntitySideButtonModel', () => ({
  useEntitySideButtonModel: () => ({
    catalogFor: () => [],
  }),
}));

const tabs = {
  entity: entityWithRelations,
  hasMainDocument: true,
  filesSideTabs: { showTranslationsTab: false, translationsCount: 0 },
};

describe('useEntityPaneTabs', () => {
  let store: ReturnType<typeof createStore>;
  let location: Location;
  let navigate: NavigateFunction;

  const LocationProbe = () => {
    location = useLocation();
    navigate = useNavigate();
    return null;
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={['/?m=relationships#s=search']}>
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
  });

  it('does not mark the side tab pending when the hash already has it', async () => {
    const { result } = renderHook(() => useEntityPaneTabs(tabs), { wrapper });

    await act(async () => {
      result.current.commit('left', MAIN_TAB.METADATA);
      await Promise.resolve();
    });

    expect(store.get(pendingSideTabAtom)).toBeNull();
    expect(location.search).toContain('m=metadata');
    expect(location.hash).toContain('s=search');
  });

  it('opens a document hit on the right when Search is the left tab', async () => {
    const { result } = renderHook(() => useEntityPaneTabs(tabs), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter initialEntries={['/?m=search#s=toc']}>
          <Provider store={store}>
            <EntityUrlSync>
              <LocationProbe />
              {children}
            </EntityUrlSync>
          </Provider>
        </MemoryRouter>
      ),
    });

    await act(async () => {
      result.current.openSearchHit(MAIN_TAB.DOCUMENT, {
        hash: next => {
          next.set('page', '4');
        },
      });
      await Promise.resolve();
    });

    expect(result.current.panes.left).toBe(SIDE_TAB.SEARCH);
    expect(result.current.panes.right).toBe(SIDE_TAB.DOCUMENT);
    expect(location.search).toContain('m=search');
    expect(location.hash).toContain('s=document');
    expect(location.hash).toContain('page=4');
  });

  it('shows the url tab on the first render when a pending tab is stale', () => {
    store.set(pendingLeftTabAtom, SIDE_TAB.METADATA);
    const seen: string[] = [];
    renderHook(
      () => {
        const pane = useEntityPaneTabs(tabs);
        seen.push(pane.panes.left);
        return pane;
      },
      { wrapper }
    );

    expect(seen[0]).toBe(SIDE_TAB.RELATIONSHIPS);
  });

  it('follows the url when it moves off a pending tab', async () => {
    const { result } = renderHook(() => useEntityPaneTabs(tabs), { wrapper });

    act(() => {
      store.set(pendingLeftTabAtom, SIDE_TAB.METADATA);
    });

    await act(async () => {
      await navigate('/?m=document#s=search');
    });

    expect(store.get(pendingLeftTabAtom)).toBeNull();
    expect(result.current.panes.left).toBe(SIDE_TAB.DOCUMENT);
  });
});

describe('useEntityPaneTabs updates', () => {
  let store: ReturnType<typeof createStore>;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={['/?m=search#s=document']}>
      <Provider store={store}>
        <EntityUrlSync>{children}</EntityUrlSync>
      </Provider>
    </MemoryRouter>
  );

  beforeEach(() => {
    store = createStore();
  });

  it('writes the page when another document hit keeps the same panes', async () => {
    const { result } = renderHook(() => useEntityPaneTabs(tabs), { wrapper });

    await act(async () => {
      result.current.openSearchHit(MAIN_TAB.DOCUMENT, {
        hash: next => {
          next.set('page', '9');
        },
      });
      await Promise.resolve();
    });

    expect(store.get(entityPageAtom)).toBe('9');
    expect(window.location.hash).toContain('page=9');
    expect(window.location.hash).toContain('s=document');
  });

  it('keeps a pending left tab when another pane hook mounts', () => {
    renderHook(() => useEntityPaneTabs(tabs), { wrapper });
    act(() => {
      store.set(pendingLeftTabAtom, SIDE_TAB.METADATA);
    });
    const { result } = renderHook(
      () => {
        const first = useEntityPaneTabs(tabs);
        const second = useEntityPaneTabs(tabs);
        return { first: first.panes.left, second: second.panes.left };
      },
      { wrapper }
    );

    expect(store.get(pendingLeftTabAtom)).toBe(SIDE_TAB.METADATA);
    expect(result.current).toEqual({ first: SIDE_TAB.METADATA, second: SIDE_TAB.METADATA });
  });
});
