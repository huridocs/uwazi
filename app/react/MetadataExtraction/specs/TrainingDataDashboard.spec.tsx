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

  // eslint-disable-next-line max-statements
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
    await expect(items[0].outerHTML).toMatch('Training');
    await expect(items[0].outerHTML).toMatch('40.00%');
    await expect(items[1].outerHTML).toMatch('Matching');
    await expect(items[1].outerHTML).toMatch('20.00%');
    await expect(items[2].outerHTML).toMatch('Non-matching');
    await expect(items[2].outerHTML).toMatch('20.00%');
    await expect(items[3].outerHTML).toMatch('Empty / Obsolete');
    await expect(items[3].outerHTML).toMatch('20.00%');
  });
});
