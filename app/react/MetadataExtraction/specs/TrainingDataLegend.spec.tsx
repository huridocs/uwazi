/**
 * @jest-environment jsdom
 */
import { render, RenderResult, within } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { TrainingDataLegend } from '../TrainingDataLegend';

describe('Render', () => {
  it('should render only components with text and include a percentage', async () => {
    const singleComponentData = [
      {
        value: 100,
        color: 'blue',
        label: { text: <>Blue</> },
      },
      {
        value: 50,
        color: 'red',
        label: { text: <>Red</> },
      },
      {
        value: 50,
        color: 'green',
      },
    ];

    let component: RenderResult;

    act(() => {
      component = render(<TrainingDataLegend data={singleComponentData} />);
    });

    const list = component!.getByRole('list');
    const items = within(list).getAllByRole('listitem');

    expect(items.length).toBe(2);
    await expect(items[0].outerHTML).toMatch('Blue');
    await expect(items[0].outerHTML).toMatch('50.00%');
    await expect(items[1].outerHTML).toMatch('Red');
    await expect(items[1].outerHTML).toMatch('25.00%');
  });
});
