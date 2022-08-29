/**
 * @jest-environment jsdom
 */
import { render, RenderResult, within } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { GridChart } from '../GridChart';
import * as containerWidthHook from '../useContainerWidthHook';

jest.spyOn(containerWidthHook, 'useContainerWidth').mockReturnValue(50);

const formatForAssertion = (items: HTMLElement[]) => [
  items
    .map((item, index) => (index % 2 === 0 ? item.outerHTML : null))
    .filter(i => i)
    .map(item => item?.substring(29, item.length - 8)),
  items
    .map((item, index) => (index % 2 === 1 ? item.outerHTML : null))
    .filter(i => i)
    .map(item => item?.substring(29, item.length - 8)),
];

describe('Render', () => {
  it('should render the correct amount of squares per color', async () => {
    const noOverlayData = [
      {
        value: 100,
        color: 'blue',
      },
      {
        value: 50,
        color: 'red',
      },
    ];

    let component: RenderResult;

    act(() => {
      component = render(<GridChart data={noOverlayData} />);
    });

    const list = component!.getByRole('list');
    const items = within(list).getAllByRole('listitem');

    expect(formatForAssertion(items)).toEqual([
      ['blue', 'blue', 'red'],
      ['blue', 'blue', 'red'],
    ]);
  });

  it('should render the correct amount of overlaying squares', async () => {
    const dataWithOverlay = [
      {
        value: 100,
        color: 'blue',
      },
      {
        value: 50,
        color: 'red',
      },
      {
        value: 50,
        color: 'green',
        overlaying: true,
      },
    ];

    let component: RenderResult;

    act(() => {
      component = render(<GridChart data={dataWithOverlay} />);
    });

    const list = component!.getByRole('list');
    const items = within(list).getAllByRole('listitem');

    expect(formatForAssertion(items)).toEqual([
      ['blue', 'blue', 'red'],
      ['green', 'blue', 'red'],
    ]);
  });
});
