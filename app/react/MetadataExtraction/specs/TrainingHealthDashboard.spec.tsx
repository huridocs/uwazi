/**
 * @jest-environment jsdom
 */
import { render, RenderResult, within } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { TrainingHealthDashboard } from '../TrainingHealthDashboard';

describe('Render', () => {
  it('should render empty if no stats yet', async () => {
    let component: RenderResult;

    act(() => {
      component = render(<TrainingHealthDashboard />);
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
      counts: {
        labeledMatching: 2,
        labeled: 2,
        nonLabeledMatching: 1,
        nonLabeledNotMatching: 1,
        emptyOrObsolete: 1,
        all: 5,
      },
      accuracy: 0.5,
    };

    let component: RenderResult;

    act(() => {
      ({ renderResult: component } = renderConnectedContainer(
        <TrainingHealthDashboard stats={stats} />,
        () => defaultState
      ));
    });

    const list = component!.getByRole('list');
    const items = within(list).getAllByRole('listitem');

    expect(items.length).toBe(5);
    await expectToMatchStrings(items, [
      ['Training', '40.00%'],
      ['Matching', '20.00%'],
      ['Non-matching', '20.00%'],
      ['Empty / Obsolete', '20.00%'],
    ]);
    await expect(items[4].innerHTML).toMatch(/Accuracy(.*)50.00%/);
  });
});
