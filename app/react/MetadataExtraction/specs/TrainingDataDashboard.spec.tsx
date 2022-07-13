/**
 * @jest-environment jsdom
 */
import { render, RenderResult, within } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { TrainingDataDashboard } from '../TrainingDataDashboard';

describe('Render', () => {
  it('should render empty if no stats yet', async () => {
    let component: RenderResult;

    act(() => {
      component = render(<TrainingDataDashboard />);
    });
    const list = component!.queryByRole('list');

    expect(list).toBe(null);
  });

  const expectToMatchStrings = async (elements: HTMLElement[], data: string[][]) =>
    Promise.all(
      data.map(async (row, rowIndex) =>
        Promise.all(row.map(async segment => expect(elements[rowIndex].outerHTML).toMatch(segment)))
      )
    );

  it('should render children with the data mapped and correct legend', async () => {
    const stats = {
      data: {
        labeledMatching: 2,
        labeled: 2,
        nonLabeledMatching: 1,
        nonLabeledOthers: 1,
        emptyOrObsolete: 1,
        all: 5,
      },
    };

    let component: RenderResult;

    act(() => {
      ({ renderResult: component } = renderConnectedContainer(
        <TrainingDataDashboard stats={stats} />,
        () => defaultState
      ));
    });

    const list = component!.getByRole('list');
    const items = within(list).getAllByRole('listitem');

    expect(items.length).toBe(4);
    await expectToMatchStrings(items, [
      ['Training', '40.00%'],
      ['Matching', '20.00%'],
      ['Non-matching', '20.00%'],
      ['Empty / Obsolete', '20.00%'],
    ]);
  });
});
