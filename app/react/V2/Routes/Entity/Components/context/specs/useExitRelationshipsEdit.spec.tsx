/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  RelationshipsSelectionProvider,
  useExitRelationshipsEdit,
  useRelationshipsSelection,
} from '../RelationshipsSelectionContext.js';

const Harness = ({ active }: { active: boolean }) => {
  useExitRelationshipsEdit(active);
  const {
    relationshipsEditMode,
    selectedRelationshipIds,
    setRelationshipsEditMode,
    setSelectedRelationshipIds,
  } = useRelationshipsSelection();
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setRelationshipsEditMode(true);
          setSelectedRelationshipIds(new Set(['rel-1']));
        }}
      >
        start
      </button>
      <span>{relationshipsEditMode ? 'editing' : 'idle'}</span>
      <span>{selectedRelationshipIds.size ? 'has selection' : 'empty selection'}</span>
    </>
  );
};

const tree = (showHarness: boolean, active: boolean) => (
  <RelationshipsSelectionProvider>
    {showHarness ? <Harness active={active} /> : <span>hidden</span>}
  </RelationshipsSelectionProvider>
);

const pair = (firstActive: boolean, secondActive: boolean) => (
  <RelationshipsSelectionProvider>
    <Harness active={firstActive} />
    <Harness active={secondActive} />
  </RelationshipsSelectionProvider>
);

const activeBesideInactive = (showActive: boolean) => (
  <RelationshipsSelectionProvider>
    <Harness active={false} />
    {showActive ? <Harness active /> : null}
  </RelationshipsSelectionProvider>
);

const startThenUnmount = () => {
  const view = render(tree(true, true));
  fireEvent.click(screen.getByRole('button', { name: 'start' }));
  view.rerender(tree(false, true));
  return view;
};

describe('useExitRelationshipsEdit', () => {
  it('shows idle and an empty selection when the only open surface unmounts and mounts again', () => {
    const { rerender } = startThenUnmount();
    rerender(tree(true, true));
    expect(screen.getByText('idle')).toBeInTheDocument();
    expect(screen.getByText('empty selection')).toBeInTheDocument();
  });

  it('clears relationship edit when the tab remounts away from Relationships', () => {
    const { rerender } = startThenUnmount();
    rerender(tree(true, false));
    expect(screen.getByText('idle')).toBeInTheDocument();
  });

  it('shows idle and an empty selection when the active surface unmounts', () => {
    const view = render(activeBesideInactive(true));
    fireEvent.click(screen.getAllByRole('button', { name: 'start' })[0]);
    expect(screen.getAllByText('editing')).toHaveLength(2);
    expect(screen.getAllByText('has selection')).toHaveLength(2);

    view.rerender(activeBesideInactive(false));
    expect(screen.getByText('idle')).toBeInTheDocument();
    expect(screen.getByText('empty selection')).toBeInTheDocument();
  });

  it('keeps relationship edit when an inactive surface stays mounted beside an active one', () => {
    const view = render(pair(false, true));
    fireEvent.click(screen.getAllByRole('button', { name: 'start' })[0]);
    expect(screen.getAllByText('editing')).toHaveLength(2);

    view.rerender(pair(false, false));
    expect(screen.getAllByText('idle')).toHaveLength(2);
  });
});
