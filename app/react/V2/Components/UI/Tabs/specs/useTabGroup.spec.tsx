/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Provider, createStore } from 'jotai';
import { fireEvent, render, screen } from '@testing-library/react';
import { mergeTabGroup, tabGroupsAtom } from '../tabsAtoms.js';
import { useTabGroup } from '../useTabGroup.js';

const TabProbe = ({ groupId, onRender }: { groupId: string; onRender: () => void }) => {
  const { activeTabId, selectTab } = useTabGroup(groupId);
  onRender();
  return (
    <button type="button" data-testid={groupId} onClick={() => selectTab('toc')}>
      {activeTabId}
    </button>
  );
};

const renderTabGroups = () => {
  const store = createStore();
  store.set(tabGroupsAtom, prev => {
    let next = mergeTabGroup(prev, 'entity-main', { activeTabId: 'document' });
    next = mergeTabGroup(next, 'entity-side', { activeTabId: 'metadata' });
    return next;
  });
  const mainRenders = jest.fn();
  const sideRenders = jest.fn();
  render(
    <Provider store={store}>
      <TabProbe groupId="entity-main" onRender={mainRenders} />
      <TabProbe groupId="entity-side" onRender={sideRenders} />
    </Provider>
  );
  return { mainRenders, sideRenders };
};

describe('useTabGroup', () => {
  it('does not rerender one group when another group changes', () => {
    const { mainRenders, sideRenders } = renderTabGroups();
    const mainCount = mainRenders.mock.calls.length;
    const sideCount = sideRenders.mock.calls.length;
    fireEvent.click(screen.getByTestId('entity-side'));
    expect(screen.getByTestId('entity-side')).toHaveTextContent('toc');
    expect(screen.getByTestId('entity-main')).toHaveTextContent('document');
    expect(mainRenders.mock.calls.length).toBe(mainCount);
    expect(sideRenders.mock.calls.length).toBeGreaterThan(sideCount);
  });
});
