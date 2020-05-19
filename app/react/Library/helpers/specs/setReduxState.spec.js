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
  let addDocumentsInsteadOfSet = true;
  let state;

  beforeEach(() => {
    spyOn(libraryActions, 'setTemplates');
    context = {
      store: {
        dispatch: jasmine.createSpy('dispatch').and.callFake(action => {
          dispatchCallsOrder.push(action.type);
        }),
      },
    };
    state = {
      library: {
        documents,
        aggregations,
        filters: { documentTypes: 'types', properties: 'properties' },
      },
    };
  });

  it('should ADD the documents and aggregations', () => {
    setReduxState(state, addDocumentsInsteadOfSet)(context.store.dispatch);
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

  describe('when the flag to set or add is false', () => {
    it('should SET the documents and aggregations', () => {
      addDocumentsInsteadOfSet = false;
      setReduxState(state, addDocumentsInsteadOfSet)(context.store.dispatch);

      expect(context.store.dispatch).toHaveBeenCalledWith({
        type: actionTypes.SET_DOCUMENTS,
        documents,
        __reducerKey: 'library',
      });
    });
  });
});
