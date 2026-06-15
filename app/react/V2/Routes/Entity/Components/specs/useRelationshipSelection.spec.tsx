/**
 * @jest-environment jsdom
 */
import React, { ReactNode } from 'react';
import { createStore, Provider } from 'jotai';
import { act, renderHook } from '@testing-library/react';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { templatesAtom } from '#V2/atoms/index.js';
import { useRelationshipSelection } from '../useRelationshipSelection.js';
import {
  activeRelationshipIdAtom,
  pdfController,
  scrollToRelationshipPanelAtom,
} from '../atoms.js';

const marker: RelationshipMarker = {
  _id: 'ref-partner-0',
  view: {
    _id: 'ref-partner-0',
    hub: 'h1',
    type: 'rel-type',
    from: {
      type: 'textReference',
      entity: 'entity1',
      entityTitle: 'Source',
      entityTemplateId: 'template1',
      file: 'file1',
      text: 'selected',
      selections: [{ page: 4, top: 10, left: 20, width: 100, height: 30 }],
    },
    to: {
      type: 'entity',
      entity: 'target1',
      entityTitle: 'Person 1',
      entityTemplateId: 'template2',
    },
    relationTypeOnSelf: false,
  },
  target: { sharedId: 'target1', title: 'Person 1', templateId: 'template2' },
  anchor: {
    type: 'textReference',
    entity: 'entity1',
    entityTitle: 'Source',
    entityTemplateId: 'template1',
    file: 'file1',
    text: 'selected',
    selections: [{ page: 4, top: 10, left: 20, width: 100, height: 30 }],
  },
};

describe('useRelationshipSelection', () => {
  let store: ReturnType<typeof createStore>;
  const goToPage = jest.fn();
  const toggleHighlights = jest.fn();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  beforeEach(() => {
    store = createStore();
    store.set(pdfController, { goToPage, toggleHighlights } as never);
    store.set(templatesAtom, [{ _id: 'template2', color: '#faca15', name: 'Person' }]);
    goToPage.mockClear();
    toggleHighlights.mockClear();
  });

  it('selects a relationship, navigates, and highlights the PDF', () => {
    const { result } = renderHook(() => useRelationshipSelection(), { wrapper });

    act(() => {
      result.current.selectRelationship(marker);
    });

    expect(store.get(activeRelationshipIdAtom)).toBe('ref-partner-0');
    expect(goToPage).toHaveBeenCalledWith(4);
    expect(toggleHighlights).toHaveBeenCalledTimes(1);
    expect(toggleHighlights.mock.calls[0][0][0][4][0].key).toBe('ref-partner-0');
  });

  it('scrolls the panel when scrollPanel is requested', () => {
    const { result } = renderHook(() => useRelationshipSelection(), { wrapper });

    act(() => {
      result.current.selectRelationship(marker, { scrollPanel: true });
    });

    expect(store.get(scrollToRelationshipPanelAtom)).toBe('ref-partner-0');
  });

  it('clears selection when the same marker is selected again', () => {
    const { result } = renderHook(() => useRelationshipSelection(), { wrapper });

    act(() => {
      result.current.selectRelationship(marker);
    });

    act(() => {
      result.current.selectRelationship(marker);
    });

    expect(store.get(activeRelationshipIdAtom)).toBeNull();
    expect(toggleHighlights).toHaveBeenLastCalledWith([]);
  });

  it('clears selection and highlights via clearRelationshipSelection', () => {
    const { result } = renderHook(() => useRelationshipSelection(), { wrapper });

    act(() => {
      result.current.selectRelationship(marker);
    });

    act(() => {
      result.current.clearRelationshipSelection();
    });

    expect(store.get(activeRelationshipIdAtom)).toBeNull();
    expect(toggleHighlights).toHaveBeenLastCalledWith([]);
  });
});
