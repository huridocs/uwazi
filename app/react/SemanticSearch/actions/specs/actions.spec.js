import Immutable from 'immutable';
import api from '../../SemanticSearchAPI';

import * as actions from '../actions';

describe('Semantic Search actions', () => {
  let dispatch;
  beforeEach(() => {
    jest.spyOn(api, 'getAllSearches').mockResolvedValue([{ _id: 'search1' }, { _id: 'search2' }]);
    dispatch = jest.fn();
  });
  afterEach(() => {
    api.getAllSearches.mockReset();
  });
  async function expectFetchSearchesToHaveBeenDispatched(dispatchMock) {
    const fetchSearchesAction = dispatch.mock.calls[0][0];
    await fetchSearchesAction(dispatchMock);
    expect(api.getAllSearches).toHaveBeenCalled();
  }

  describe('fetchSearches', () => {
    it('should fetch searches from api and dispatch response in store', async () => {
      const action = actions.fetchSearches();
      await action(dispatch);
      expect(api.getAllSearches).toHaveBeenCalled();
      expect(dispatch.mock.calls).toMatchSnapshot();
    });
  });

  describe('selectSemanticSearchDocument', () => {
    it('should set selected semantic search document and select semantic search tab in sidepanel', () => {
      const doc = { sharedId: 'document' };
      const action = actions.selectSemanticSearchDocument(doc);
      action(dispatch);
      expect(dispatch.mock.calls).toMatchSnapshot();
    });
  });

  describe('unselectSemanticSearchDocument', () => {
    it('should set the empty object as the selected semantic search document', () => {
      const action = actions.unselectSemanticSearchDocument();
      action(dispatch);
      expect(dispatch.mock.calls).toMatchSnapshot();
    });
  });

  describe('submitNewSearch', () => {
    it('should start new search and fetch searches', async () => {
      jest.spyOn(api, 'search').mockResolvedValue({ searchTerm: 'search' });
      const args = { searchTerm: 'search' };
      const action = actions.submitNewSearch(args);
      await action(dispatch);
      expect(api.search).toHaveBeenCalledWith(args);
      expectFetchSearchesToHaveBeenDispatched(dispatch);
    });
  });

  describe('showSemanticSearch', () => {
    it('should show semantic search panel', () => {
      const action = actions.showSemanticSearch();
      action(dispatch);
      expect(dispatch.mock.calls).toMatchSnapshot();
    });
  });

  describe('hideSemanticSearch', () => {
    it('should hide semantic search panel', () => {
      const action = actions.hideSemanticSearch();
      action(dispatch);
      expect(dispatch.mock.calls).toMatchSnapshot();
    });
  });

  describe('deleteSearch', () => {
    it('should delete search and re-fetch searches', async () => {
      jest.spyOn(api, 'deleteSearch').mockResolvedValue({ deleted: true });
      const searchId = 'search';
      const action = actions.deleteSearch(searchId);
      await action(dispatch);
      expect(api.deleteSearch).toHaveBeenCalledWith(searchId);
      expectFetchSearchesToHaveBeenDispatched(dispatch);
    });
  });

  describe('stopSearch', () => {
    it('should stop search and re-fetch searches', async () => {
      jest.spyOn(api, 'stopSearch').mockResolvedValue({ status: 'stopped' });
      const searchId = 'search';
      const action = actions.stopSearch(searchId);
      await action(dispatch);
      expect(api.stopSearch).toHaveBeenCalledWith(searchId);
      expectFetchSearchesToHaveBeenDispatched(dispatch);
    });
  });

  describe('resumeSearch', () => {
    it('should resume search and re-fetch searches', async () => {
      jest.spyOn(api, 'resumeSearch').mockResolvedValue({ status: 'pending' });
      const searchId = 'search';
      const action = actions.resumeSearch(searchId);
      await action(dispatch);
      expect(api.resumeSearch).toHaveBeenCalledWith(searchId);
      expectFetchSearchesToHaveBeenDispatched(dispatch);
    });
  });

  describe('registerForUpdates', () => {
    it('should request update notifications from API', async () => {
      jest.spyOn(api, 'registerForUpdates').mockResolvedValue({ ok: true });
      const action = actions.registerForUpdates();
      await action();
      expect(api.registerForUpdates).toHaveBeenCalled();
    });
  });

  describe('updateSearch', () => {
    it('should update specified search in the searches store', async () => {
      const updatedSearch = { _id: 'search', status: 'completed' };
      const action = actions.updateSearch(updatedSearch);
      action(dispatch);
      expect(dispatch.mock.calls).toMatchSnapshot();
    });
  });

  describe('addSearchResults', () => {
    let currentResults;
    beforeEach(() => {
      currentResults = [{ _id: 'search1' }, { _id: 'search2' }];
    });
    const getState = () => ({
      semanticSearch: {
        search: Immutable.fromJS({
          results: currentResults
        })
      }
    });
    it('should add specified documents to current search results', () => {
      const newDocs = [{ _id: 'new1' }, { _id: 'new2' }];
      const action = actions.addSearchResults(newDocs);
      action(dispatch, getState);
      expect(dispatch.mock.calls).toMatchSnapshot();
    });
    it('should not add duplicate documents in search results', () => {
      currentResults = [{ _id: 'search1' }, { _id: 'search2' }, { _id: 'new1' }];
      const newDocs = [{ _id: 'new1' }, { _id: 'new2' }];
      const action = actions.addSearchResults(newDocs);
      action(dispatch, getState);
      expect(dispatch.mock.calls).toMatchSnapshot();
    });
  });
});
