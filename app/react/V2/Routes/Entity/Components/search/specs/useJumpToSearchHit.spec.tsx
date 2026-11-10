/**
 * @jest-environment jsdom
 */
import React, { type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { focusMetadataFieldAtom } from '#V2/Components/Metadata/focusMetadataFieldAtom.js';
import { MAIN_TAB } from '../../../Tabs/tabIds.js';
import { useJumpToSearchHit } from '../useJumpToSearchHit.js';

const mockOpenSearchHit = jest.fn();

jest.mock('#V2/Routes/Entity/Tabs/EntityTabsContext.js', () => ({
  useEntityTabNavigation: () => ({
    openSearchHit: mockOpenSearchHit,
  }),
}));

describe('useJumpToSearchHit', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={createStore()}>{children}</Provider>
  );

  beforeEach(() => {
    mockOpenSearchHit.mockClear();
  });

  it('jumpToProperty focuses the field and opens metadata', () => {
    const store = createStore();
    const { result } = renderHook(() => useJumpToSearchHit(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      ),
    });

    act(() => {
      result.current.jumpToProperty('metadata.description.value');
    });

    expect(store.get(focusMetadataFieldAtom)).toEqual({ fieldKey: 'description' });
    expect(mockOpenSearchHit).toHaveBeenCalledWith(MAIN_TAB.METADATA);
  });

  it('forwards a document hit and its hash patch', () => {
    const hash = jest.fn();
    const { result } = renderHook(() => useJumpToSearchHit(), { wrapper });

    act(() => {
      result.current.ensureMainTab(MAIN_TAB.DOCUMENT, { hash });
    });

    expect(mockOpenSearchHit).toHaveBeenCalledWith(MAIN_TAB.DOCUMENT, { hash });
  });
});
