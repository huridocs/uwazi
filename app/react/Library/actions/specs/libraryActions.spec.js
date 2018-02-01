import backend from 'fetch-mock';
import {APIURL} from 'app/config.js';
import Immutable from 'immutable';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {mockID} from 'shared/uniqueID.js';

import * as actions from 'app/Library/actions/libraryActions';
import * as types from 'app/Library/actions/actionTypes';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';
import documents from 'app/Documents';
import {api} from 'app/Entities';
import {browserHistory} from 'react-router';

import referencesAPI from 'app/Viewer/referencesAPI';
import SearchApi from 'app/Search/SearchAPI';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('libraryActions', () => {
  let documentCollection = [{name: 'Secret list of things'}];
  let aggregations = [{prop: {buckets: []}}];
  let templates = [{name: 'Decision'}, {name: 'Ruling'}];
  let thesauris = [{_id: 'abc1'}];

  describe('setDocuments', () => {
    it('should return a SET_DOCUMENTS action ', () => {
      let action = actions.setDocuments(documentCollection);
      expect(action).toEqual({type: types.SET_DOCUMENTS, documents: documentCollection});
    });
  });

  describe('setTemplates', () => {
    let documentTypes = ['typea'];
    let dispatch;
    let getState;
    let filters = {
      documentTypes,
      properties: ['library properties']
    };

    beforeEach(() => {
      dispatch = jasmine.createSpy('dispatch');
      getState = jasmine.createSpy('getState').and.returnValue({library: {filters: Immutable.fromJS(filters), search: {}}});
    });

    it('should dispatch a SET_LIBRARY_TEMPLATES action ', () => {
      actions.setTemplates(templates, thesauris)(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith({
        type: types.SET_LIBRARY_TEMPLATES,
        templates,
        thesauris
      });
    });
  });

  describe('enterLirabry', () => {
    it('should return a ENTER_LIBRARY action ', () => {
      let action = actions.enterLibrary();
      expect(action).toEqual({type: types.ENTER_LIBRARY});
    });
  });

  describe('hideFilters', () => {
    it('should return a HIDE_FILTERS action ', () => {
      let action = actions.hideFilters();
      expect(action).toEqual({type: types.HIDE_FILTERS});
    });
  });

  describe('showFilters', () => {
    it('should return a SHOW_FILTERS action ', () => {
      let action = actions.showFilters();
      expect(action).toEqual({type: types.SHOW_FILTERS});
    });
  });

  describe('setPreviewDoc', () => {
    it('should return a SET_PREVIEW_DOC action ', () => {
      let action = actions.setPreviewDoc('id');
      expect(action).toEqual({type: types.SET_PREVIEW_DOC, docId: 'id'});
    });
  });

  describe('overSuggestions', () => {
    it('should return a OVER_SUGGESTIONS action ', () => {
      let action = actions.setOverSuggestions(true);
      expect(action).toEqual({type: types.OVER_SUGGESTIONS, hover: true});
    });
  });

  describe('encodeSearch', () => {
    it('should return a query string with ?q= at the beginning by default', () => {
      expect(actions.encodeSearch({a: 1, b: 'z'})).toBe('?q=(a:1,b:z)');
    });
    it('should allow returning a rison query value, not appending the ?q= when other options may be found in the URL', () => {
      expect(actions.encodeSearch({a: 1, b: 'z'}, false)).toBe('(a:1,b:z)');
    });
  });

  describe('async action', () => {
    let dispatch;
    beforeEach(() => {
      backend.restore();
      backend
      .get(APIURL + 'search/match_title?searchTerm=batman', {body: JSON.stringify(documentCollection)})
      .get(APIURL + 'search?searchTerm=batman', {body: JSON.stringify(documentCollection)})
      .get(APIURL +
        'search?searchTerm=batman' +
        '&filters=%7B%22author%22%3A%7B%22value%22%3A%22batman%22%2C%22type%22%3A%22text%22%7D%7D' +
        '&aggregations=%5B%5D' +
        '&types=%5B%22decision%22%5D',
        {body: JSON.stringify({rows: documentCollection, aggregations})}
      )
      .get(APIURL + 'search?searchTerm=batman&filters=%7B%7D&aggregations=%5B%5D&types=%5B%22decision%22%5D',
            {body: JSON.stringify({rows: documentCollection, aggregations})});
      dispatch = jasmine.createSpy('dispatch');
    });

    afterEach(() => backend.restore());

    describe('searchDocuments', () => {
      let store;
      let getState;
      let state;
      const storeKey = 'library';
      beforeEach(() => {
        state = {properties: [
          {name: 'author', active: true},
          {name: 'inactive'},
          {name: 'date', type: 'date', active: true},
          {name: 'select', type: 'select', active: true},
          {name: 'multiselect', type: 'multiselect', active: true},
          {name: 'nested', type: 'nested', active: true, nestedProperties: [{key: 'prop1', label: 'prop one'}]}
        ], documentTypes: ['decision']};
        store = {library: {filters: Immutable.fromJS(state), search: {searchTerm: 'batman'}}};
        spyOn(browserHistory, 'getCurrentLocation').and.returnValue({pathname: '/library', query: {view: 'chart'}, search: '?q=()'});
        getState = jasmine.createSpy('getState').and.returnValue(store);
      });

      it('should convert the search and set it to the url query based on filters on the state', () => {
        const search = {
          searchTerm: 'batman',
          filters: {
            author: 'batman',
            date: 'dateValue',
            select: 'selectValue',
            multiselect: 'multiValue',
            nested: 'nestedValue'
          }
        };

        const limit = 'limit';
        spyOn(browserHistory, 'push');
        actions.searchDocuments({search}, storeKey, limit)(dispatch, getState);
        expect(browserHistory.push).toHaveBeenCalledWith(`/library/?view=chart&q=(filters:(author:batman,date:dateValue,multiselect:multiValue,nested:nestedValue,select:selectValue),limit:limit,searchTerm:batman,sort:_score,types:!(decision))`); //eslint-disable-line
      });

      it('should use passed filters when passed', () => {
        const search = {
          searchTerm: 'batman',
          filters: {
            author: 'batman',
            date: {from: null},
            select: 'selectValue',
            multiselect: {values: []},
            nested: 'nestedValue',
            object: {}
          }
        };

        const filters = store.library.filters;

        const limit = 'limit';
        spyOn(browserHistory, 'push');
        actions.searchDocuments({search, filters}, storeKey, limit)(dispatch, getState);

        expect(browserHistory.push).toHaveBeenCalledWith(`/library/?view=chart&q=(filters:(author:batman,nested:nestedValue,select:selectValue),limit:limit,searchTerm:batman,sort:_score,types:!(decision))`); //eslint-disable-line
      });

      it('should set the storeKey selectedSorting if user has selected a custom sorting', () => {
        const expectedDispatch = {
          type: 'library.selectedSorting/SET',
          value: {searchTerm: 'batman', filters: {author: 'batman'}, userSelectedSorting: true}
        };
        actions.searchDocuments(
          {search: {searchTerm: 'batman', filters: {author: 'batman'}, userSelectedSorting: true}}, storeKey
        )(dispatch, getState);
        expect(dispatch).toHaveBeenCalledWith(expectedDispatch);
      });

      it('should set sort by relevance when the search term has changed and has value', () => {
        browserHistory
        .getCurrentLocation
        .and.returnValue({pathname: '/library', query: {view: 'chart'}, search: '?q=(searchTerm:%27batman%20begings%27)'});
        spyOn(browserHistory, 'push');
        actions.searchDocuments(
          {search: {searchTerm: 'batman'}, filters: {properties: []}}, storeKey
        )(dispatch, getState);
        expect(browserHistory.push).toHaveBeenCalledWith('/library/?view=chart&q=(searchTerm:batman,sort:_score)');
      });
    });

    describe('saveDocument', () => {
      it('should save the document and dispatch a notification on success', (done) => {
        mockID();
        spyOn(documents.api, 'save').and.returnValue(Promise.resolve('response'));
        spyOn(referencesAPI, 'get').and.returnValue(Promise.resolve('response'));
        let doc = {name: 'doc'};

        const expectedActions = [
          {type: notificationsTypes.NOTIFY, notification: {message: 'Document updated', type: 'success', id: 'unique_id'}},
          {type: 'rrf/reset', model: 'library.sidepanel.metadata'},
          {type: types.UPDATE_DOCUMENT, doc: 'response'},
          {type: types.SELECT_SINGLE_DOCUMENT, doc: 'response'}
        ];
        const store = mockStore({});

        store.dispatch(actions.saveDocument(doc, 'library.sidepanel.metadata'))
        .then(() => {
          expect(documents.api.save).toHaveBeenCalledWith(doc);
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
    });

    describe('multipleUpdate', () => {
      it('should update selected entities with the given metadata', (done) => {
        mockID();
        spyOn(api, 'multipleUpdate').and.returnValue(Promise.resolve('response'));
        let entities = Immutable.fromJS([{sharedId: '1'}, {sharedId: '2'}]);
        const metadata = {text: 'something new'};

        const expectedActions = [
          {type: notificationsTypes.NOTIFY, notification: {message: 'Update success', type: 'success', id: 'unique_id'}},
          {type: types.UPDATE_DOCUMENTS, docs: [{sharedId: '1', metadata}, {sharedId: '2', metadata}]}
        ];
        const store = mockStore({});
        store.dispatch(actions.multipleUpdate(entities, {metadata}))
        .then(() => {
          expect(api.multipleUpdate).toHaveBeenCalledWith(['1', '2'], {metadata});
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
    });

    describe('deleteDocument', () => {
      it('should delete the document and dispatch a notification on success', (done) => {
        mockID();
        spyOn(documents.api, 'delete').and.returnValue(Promise.resolve('response'));
        let doc = {name: 'doc'};

        const expectedActions = [
          {type: notificationsTypes.NOTIFY, notification: {message: 'Document deleted', type: 'success', id: 'unique_id'}},
          {type: types.UNSELECT_ALL_DOCUMENTS},
          {type: types.REMOVE_DOCUMENT, doc}
        ];
        const store = mockStore({});

        store.dispatch(actions.deleteDocument(doc))
        .then(() => {
          expect(documents.api.delete).toHaveBeenCalledWith(doc);
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
    });

    describe('searchSnippets', () => {
      it('should search snippets for the searchTerm', (done) => {
        spyOn(SearchApi, 'searchSnippets').and.returnValue(Promise.resolve('response'));

        const expectedActions = [
          {type: 'storeKey.sidepanel.snippets/SET', value: 'response'}
        ];

        const store = mockStore({locale: 'es'});

        store.dispatch(actions.searchSnippets('query', 'sharedId', 'storeKey'))
        .then((snippets) => {
          expect(snippets).toBe('response');
          expect(SearchApi.searchSnippets).toHaveBeenCalledWith('query', 'sharedId');
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
    });

    describe('getDocumentReferences', () => {
      it('should set the library sidepanel references', (done) => {
        mockID();
        spyOn(referencesAPI, 'get').and.returnValue(Promise.resolve('referencesResponse'));

        const expectedActions = [
          {type: 'library.sidepanel.references/SET', value: 'referencesResponse'}
        ];

        const store = mockStore({locale: 'es'});

        store.dispatch(actions.getDocumentReferences('id', 'library'))
        .then(() => {
          expect(referencesAPI.get).toHaveBeenCalledWith('id');
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
    });
  });
});
