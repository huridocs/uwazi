/**
 * @jest-environment jsdom
 *
 * Validates that Charts loadable components resolve correctly with named exports.
 * Regression test for: "TypeError: can't convert undefined to object" when
 * loadable assumes default export but component uses named export.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { StackedDualBarChart } from '../index.js';

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

const dummyData = [
  { xAxisName: 'A', setAValue: 10, setBValue: 5 },
  { xAxisName: 'B', setAValue: 8, setBValue: 12 },
];

describe('Charts loadable (named exports)', () => {
  it('should resolve and render StackedDualBarChart from loadable without TypeError', async () => {
    const { container } = render(<StackedDualBarChart data={dummyData} chartLabel="Test" />);
    await waitFor(
      () => {
        const chartContainer = container.querySelector('.recharts-responsive-container');
        expect(chartContainer).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });
});
