/**
 * @jest-environment jsdom
 */

import { Store } from 'redux';

import create from '#app/store.js';

import { IStore } from '#V2/shared/types.js';
import { updatePageDatasets } from '#app/Pages/utils/updatePageDatasets.js';
import Immutable from 'immutable';

const { fromJS } = Immutable;
describe('Update page datasets', () => {
  let ReduxStore: Store<IStore>;

  beforeEach(() => {
    ReduxStore = create({
      page: {
        datasets: fromJS({
          default: { rows: [], totalRows: 10, aggregations: {} },
          dataset1: { rows: [], totalRows: 10, aggregations: {} },
        }),
      },
    });

    spyOn(ReduxStore, 'dispatch');
  });

  it('should update the selected dataset', () => {
    updatePageDatasets('dataset1', { rows: [], totalRows: 7, aggregations: { new: 'info' } });

    expect(ReduxStore.dispatch).toHaveBeenCalledWith({
      type: 'page/datasets/SET',
      value: {
        default: { rows: [], totalRows: 10, aggregations: {} },
        dataset1: { rows: [], totalRows: 7, aggregations: { new: 'info' } },
      },
    });
  });

  it('should not dispatch if there is no dataset', () => {
    updatePageDatasets('dataset2', { rows: [], totalRows: 7, aggregations: { new: 'info' } });

    expect(ReduxStore.dispatch).not.toHaveBeenCalled();
  });
});
