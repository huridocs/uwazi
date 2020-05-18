import * as actionTypes from 'app/Library/actions/actionTypes';
import * as libraryActions from '../../actions/libraryActions';
import setReduxState from '../setReduxState';

describe('setReduxState()', () => {
  const aggregations = { buckets: [] };
  const documents = {
    rows: [{ title: 'Something to publish' }, { title: 'My best recipes' }],
    totalRows: 2,
    aggregations,
  };
  const dispatchCallsOrder = [];
  let context;

  beforeEach(() => {
    spyOn(libraryActions, 'setTemplates');
    context = {
      store: {
        dispatch: jasmine.createSpy('dispatch').and.callFake(action => {
          dispatchCallsOrder.push(action.type);
        }),
      },
    };
    const state = {
      library: {
        documents,
        aggregations,
        filters: { documentTypes: 'types', properties: 'properties' },
      },
    };
    setReduxState(state)(context.store.dispatch);
  });

  it('should set the documents and aggregations and Unset the documents as first action', () => {
    expect(context.store.dispatch).toHaveBeenCalledWith({
      type: actionTypes.ADD_DOCUMENTS,
      documents,
      __reducerKey: 'library',
    });
    expect(context.store.dispatch).toHaveBeenCalledWith({
      type: actionTypes.INITIALIZE_FILTERS_FORM,
      documentTypes: 'types',
      libraryFilters: 'properties',
      aggregations,
      __reducerKey: 'library',
    });
  });
});
