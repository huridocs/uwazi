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
  const { relationshipsEditMode, setRelationshipsEditMode } = useRelationshipsSelection();
  return (
    <>
      <button type="button" onClick={() => setRelationshipsEditMode(true)}>
        start
      </button>
      <span>{relationshipsEditMode ? 'editing' : 'idle'}</span>
    </>
  );
};

const tree = (showHarness: boolean, active: boolean) => (
  <RelationshipsSelectionProvider>
    {showHarness ? <Harness active={active} /> : <span>hidden</span>}
  </RelationshipsSelectionProvider>
);

const startThenUnmount = () => {
  const view = render(tree(true, true));
  fireEvent.click(screen.getByRole('button', { name: 'start' }));
  view.rerender(tree(false, true));
  return view;
};

describe('useExitRelationshipsEdit', () => {
  it('clears relationship edit after an unmounted tab no longer counts as open', () => {
    const { rerender } = startThenUnmount();
    rerender(tree(true, true));
    expect(screen.getByText('editing')).toBeInTheDocument();

    rerender(tree(true, false));
    expect(screen.getByText('idle')).toBeInTheDocument();
  });

  it('clears relationship edit when the tab remounts away from Relationships', () => {
    const { rerender } = startThenUnmount();
    rerender(tree(true, false));
    expect(screen.getByText('idle')).toBeInTheDocument();
  });
});
