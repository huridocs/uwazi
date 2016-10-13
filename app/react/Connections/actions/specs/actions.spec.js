import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import api from 'app/utils/api';

import * as actions from '../actions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Connections actions', () => {
  let store;

  beforeEach(() => {
    store = mockStore({});
    spyOn(api, 'get').and.returnValue(Promise.resolve({json: {rows: [{type: 'entity'}, {type: 'doc'}]}}));
  });

  describe('Search-related actions', () => {
    describe('immidiateSearch', () => {
      fit('should search for connections', () => {
        actions.immidiateSearch(store.dispatch, 'term');
        expect(api.get).toHaveBeenCalledWith('search', {searchTerm: 'term', fields: ['doc.title']});
        expect(store.getActions()).toContain({type: 'SEARCHING_CONNECTIONS'});
      });

      fit('should set the results upon response', (done) => {
        actions.immidiateSearch(store.dispatch, 'term')
        .then(() => {
          const expectedAction = {type: 'connections/searchResults/SET', value: [{type: 'entity'}, {type: 'doc'}]};
          expect(store.getActions()).toContain(expectedAction);
          done();
        });
      });

      fit('should not include entities if targetRanged', (done) => {
        actions.immidiateSearch(store.dispatch, 'term', 'targetRanged')
        .then(() => {
          const expectedAction = {type: 'connections/searchResults/SET', value: [{type: 'doc'}]};
          expect(store.getActions()).toContain(expectedAction);
          done();
        });
      });
    });
  });

  describe('startNewConnection', () => {
    fit('should perform an immediate empty search', () => {
      actions.startNewConnection('type', 'sourceId')(store.dispatch);
      expect(api.get).toHaveBeenCalledWith('search', {searchTerm: '', fields: ['doc.title']});
    });
  });
});
