/**
 * @jest-environment jsdom
 */
import React, { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import type { TocSchema } from '#shared/types/commonTypes.js';
import type { Entity } from '#V2/api/entities/types.js';
import {
  EntityScopedProvider,
  useToc,
  useTocActions,
  useToCFileSync,
} from '#V2/Routes/Entity/Components/context/index.js';
import { TocProvider } from '../../context/TocContext.js';
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

const added: TocSchema = { label: 'Added', indentation: 0, selectionRectangles: [] };

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <EntityScopedProvider entity={entity} language={entity.language ?? 'en'}>
      {children}
    </EntityScopedProvider>
  </MemoryRouter>
);

const tocProviderWrapper = ({ children }: { children: ReactNode }) => (
  <TocProvider>{children}</TocProvider>
);

const useTocTestState = () => ({
  state: useToc(),
  actions: useTocActions(),
});

const useSyncedToc = (tocEntries: TocSchema[] | undefined, fileId: string | undefined) => {
  useToCFileSync(tocEntries, fileId);
  return useTocTestState();
};

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
      result.current.actions.addEntry(added);
    });

    expect(result.current.state.toc).toEqual([added]);
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

describe('toc file sync', () => {
  const fileId = 'file-1';

  it('keeps saved entries when adding in edit mode', () => {
    const { result } = renderHook(() => useSyncedToc(toc, fileId), {
      wrapper: tocProviderWrapper,
    });

    expect(result.current.state.toc).toEqual(toc);

    act(() => {
      result.current.actions.addEntry(added);
    });

    expect(result.current.state.toc).toEqual([...toc, added]);
    expect(result.current.state.isEditMode).toBe(true);
  });

  it('keeps the draft when syncing empty or saved toc in edit mode', () => {
    const initialProps: { fileToc: TocSchema[] | undefined } = { fileToc: undefined };
    const { result, rerender } = renderHook(
      ({ fileToc }: { fileToc: TocSchema[] | undefined }) => useSyncedToc(fileToc, fileId),
      { wrapper: tocProviderWrapper, initialProps }
    );

    act(() => {
      result.current.actions.addEntry(added);
    });

    rerender({ fileToc: [] });
    expect(result.current.state.toc).toEqual([added]);
    expect(result.current.state.isEditMode).toBe(true);

    rerender({ fileToc: toc });
    expect(result.current.state.toc).toEqual([added]);
    expect(result.current.state.isEditMode).toBe(true);
  });

  it('resets and hydrates when fileId changes', () => {
    const other: TocSchema[] = [{ label: 'Other', indentation: 0, selectionRectangles: [] }];
    const { result, rerender } = renderHook(
      ({ fileToc, id }: { fileToc?: TocSchema[]; id: string }) => useSyncedToc(fileToc, id),
      { wrapper: tocProviderWrapper, initialProps: { fileToc: toc, id: fileId } }
    );

    act(() => {
      result.current.actions.addEntry(added);
    });

    rerender({ fileToc: other, id: 'file-2' });
    expect(result.current.state.isEditMode).toBe(false);
    expect(result.current.state.toc).toEqual(other);
  });

  it('keeps the draft when file sync remounts', () => {
    const Sync = ({ fileToc, id }: { fileToc?: TocSchema[]; id?: string }) => {
      useToCFileSync(fileToc, id);
      return null;
    };

    const Harness = ({
      mountSync,
      fileToc,
      id,
    }: {
      mountSync: boolean;
      fileToc?: TocSchema[];
      id?: string;
    }) => {
      const state = useToc();
      const actions = useTocActions();
      return (
        <>
          {mountSync ? <Sync fileToc={fileToc} id={id} /> : null}
          <button type="button" onClick={() => actions.addEntry(added)}>
            add
          </button>
          <span data-testid="labels">{state.toc?.map(entry => entry.label).join(',') ?? ''}</span>
          <span data-testid="edit">{String(state.isEditMode)}</span>
        </>
      );
    };

    const { rerender } = render(<Harness mountSync fileToc={undefined} id={fileId} />, {
      wrapper: tocProviderWrapper,
    });

    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    expect(screen.getByTestId('labels')).toHaveTextContent('Added');
    expect(screen.getByTestId('edit')).toHaveTextContent('true');

    rerender(<Harness mountSync={false} fileToc={[]} id={fileId} />);
    expect(screen.getByTestId('labels')).toHaveTextContent('Added');
    expect(screen.getByTestId('edit')).toHaveTextContent('true');

    rerender(<Harness mountSync fileToc={[]} id={fileId} />);
    expect(screen.getByTestId('labels')).toHaveTextContent('Added');
    expect(screen.getByTestId('edit')).toHaveTextContent('true');

    rerender(<Harness mountSync fileToc={toc} id={fileId} />);
    expect(screen.getByTestId('labels')).toHaveTextContent('Added');
    expect(screen.getByTestId('edit')).toHaveTextContent('true');
  });
});
