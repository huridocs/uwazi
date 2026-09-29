/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderHook } from '@testing-library/react';
import { EntityMainTabsProvider } from '#V2/Routes/Entity/Tabs/EntityTabsContext.js';
import { createStubEntityTabsState } from '../../specs/helpers/createStubEntityTabsState.js';
import { useRevealSidePane } from '../useRevealSidePane.js';

describe('useRevealSidePane', () => {
  it('asks for the side pane only while the overlay is open', () => {
    const showSidePane = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <EntityMainTabsProvider value={createStubEntityTabsState({ showSidePane })}>
        {children}
      </EntityMainTabsProvider>
    );
    const { rerender } = renderHook(({ active }) => useRevealSidePane(active), {
      wrapper,
      initialProps: { active: false },
    });

    expect(showSidePane).not.toHaveBeenCalled();

    rerender({ active: true });
    expect(showSidePane).toHaveBeenCalledTimes(1);

    rerender({ active: true });
    expect(showSidePane).toHaveBeenCalledTimes(1);
  });
});
