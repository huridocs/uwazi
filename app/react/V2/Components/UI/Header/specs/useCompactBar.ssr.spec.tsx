/**
 * @jest-environment node
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useCompactBar } from '../useCompactBar.js';

jest.mock('#app/V2/CustomHooks/useIsMobile.js', () => ({
  useIsMobile: () => false,
  MOBILE_VIEW_MAX_WIDTH: 768,
}));

const Probe = () => {
  const { barRef } = useCompactBar();
  return <div ref={barRef} />;
};

describe('useCompactBar server render', () => {
  it('does not warn about useLayoutEffect', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    renderToString(<Probe />);
    const warned = error.mock.calls.some(call => String(call[0]).includes('useLayoutEffect'));
    error.mockRestore();
    expect(warned).toBe(false);
  });
});
