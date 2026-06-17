/**
 * @jest-environment jsdom
 */
import React, { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import type { TocSchema } from '#shared/types/commonTypes.js';
import type { Entity } from '#V2/api/entities/types.js';
import { EntityScopedProvider, useToc, useTocActions } from '../../context/EntityScopedProvider.js';
import { convertTextSelectionToTocEntry } from '../utils.js';

const entity = {
  _id: 'ent1',
  sharedId: 'shared1',
  language: 'en',
  title: 'Source',
  template: 'template1',
  creationDate: 1,
  user: 'user1',
  relations: [],
} as Entity;

const toc: TocSchema[] = [
  { label: 'Chapter', indentation: 0, selectionRectangles: [] },
  { label: 'Section', indentation: 1, selectionRectangles: [] },
];

const wrapper = ({ children }: { children: ReactNode }) => (
  <EntityScopedProvider entity={entity}>{children}</EntityScopedProvider>
);

const useTocTestState = () => ({
  state: useToc(),
  actions: useTocActions(),
});

describe('toc context state', () => {
  it('sets, updates, and deletes entries', () => {
    const { result } = renderHook(() => useTocTestState(), { wrapper });

    act(() => {
      result.current.actions.setToc(toc);
      result.current.actions.updateEntry(0, { label: 'Updated' });
      result.current.actions.deleteEntry(1);
    });

    expect(result.current.state.toc).toEqual([
      { label: 'Updated', indentation: 0, selectionRectangles: [] },
    ]);
  });

  it('adds entries in edit mode', () => {
    const { result } = renderHook(() => useTocTestState(), { wrapper });

    act(() => {
      result.current.actions.addEntry({ label: 'Added', indentation: 0, selectionRectangles: [] });
    });

    expect(result.current.state.toc).toEqual([
      { label: 'Added', indentation: 0, selectionRectangles: [] },
    ]);
    expect(result.current.state.isEditMode).toBe(true);
  });

  it('converts a text selection to a toc entry', () => {
    const selection: TextSelection = {
      text: '  Selected heading  ',
      selectionRectangles: [{ top: 1, left: 2, width: 3, height: 4, regionId: '5' }],
    };

    expect(convertTextSelectionToTocEntry(selection)).toEqual({
      label: 'Selected heading',
      indentation: 0,
      selectionRectangles: [{ top: 1, left: 2, width: 3, height: 4, page: '5' }],
    });
  });
});
