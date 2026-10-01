/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { useRevealSidePane } from '../useRevealSidePane.js';

describe('useRevealSidePane', () => {
  it('asks for the side pane only while the overlay is open', () => {
    const showSidePane = jest.fn();
    const { rerender } = renderHook(({ active }) => useRevealSidePane(active, showSidePane), {
      initialProps: { active: false },
    });

    expect(showSidePane).not.toHaveBeenCalled();

    rerender({ active: true });
    expect(showSidePane).toHaveBeenCalledTimes(1);

    rerender({ active: true });
    expect(showSidePane).toHaveBeenCalledTimes(1);
  });
});
