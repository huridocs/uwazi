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
      const fetchSearchesAction = dispatch.mock.calls[0][0];
      await fetchSearchesAction(dispatch);
      expect(api.getAllSearches).toHaveBeenCalled();
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
});
