/**
 * @format
 * @jest-environment jsdom
 */

import backend from 'fetch-mock';
import { APIURL } from 'app/config.js';
import Immutable from 'immutable';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { mockID } from 'shared/uniqueID.js';
import rison from 'rison';
import { RequestParams } from 'app/utils/RequestParams';

import * as actions from 'app/Library/actions/libraryActions';
import * as types from 'app/Library/actions/actionTypes';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';
import { documentsApi } from 'app/Documents';
import { api } from 'app/Entities';
import { browserHistory } from 'react-router';

import referencesAPI from 'app/Viewer/referencesAPI';
import SearchApi from 'app/Search/SearchAPI';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('libraryActions', () => {
  const documentCollection = [{ name: 'Secret list of things' }];
  const aggregations = [{ prop: { buckets: [] } }];
  const templates = [{ name: 'Decision' }, { name: 'Ruling' }];
  const thesauris = [{ _id: 'abc1' }];

  describe('setDocuments', () => {
    it('should return a SET_DOCUMENTS action ', () => {
      const action = actions.setDocuments(documentCollection);
      expect(action).toEqual({ type: types.SET_DOCUMENTS, documents: documentCollection });
    });
  });

  describe('setTemplates', () => {
    const documentTypes = ['typea'];
    let dispatch;
    let getState;
    const filters = {
      documentTypes,
      properties: ['library properties'],
    };

    beforeEach(() => {
      dispatch = jasmine.createSpy('dispatch');
      getState = jasmine
        .createSpy('getState')
        .and.returnValue({ library: { filters: Immutable.fromJS(filters), search: {} } });
    });

    it('should dispatch a SET_LIBRARY_TEMPLATES action ', () => {
      actions.setTemplates(templates, thesauris)(dispatch, getState);
      expect(dispatch).toHaveBeenCalledWith({
        type: types.SET_LIBRARY_TEMPLATES,
        templates,
        thesauris,
      });
    });
  });

  describe('enterLibrary', () => {
    it('should return a ENTER_LIBRARY action ', () => {
      const action = actions.enterLibrary();
      expect(action).toEqual({ type: types.ENTER_LIBRARY });
    });
  });

  describe('hideFilters', () => {
    it('should return a HIDE_FILTERS action ', () => {
      const action = actions.hideFilters();
      expect(action).toEqual({ type: types.HIDE_FILTERS });
    });
  });

  describe('showFilters', () => {
    it('should return a SHOW_FILTERS action ', () => {
      const action = actions.showFilters();
      expect(action).toEqual({ type: types.SHOW_FILTERS });
    });
  });

  describe('setPreviewDoc', () => {
    it('should return a SET_PREVIEW_DOC action ', () => {
      const action = actions.setPreviewDoc('id');
      expect(action).toEqual({ type: types.SET_PREVIEW_DOC, docId: 'id' });
    });
  });

  describe('overSuggestions', () => {
    it('should return a OVER_SUGGESTIONS action ', () => {
      const action = actions.setOverSuggestions(true);
      expect(action).toEqual({ type: types.OVER_SUGGESTIONS, hover: true });
    });
  });

  describe('encodeSearch', () => {
    it('should return a query string with ?q= at the beginning by default', () => {
      expect(actions.encodeSearch({ a: 1, b: 'z' })).toBe('?q=(a:1,b:z)');
    });

    it('should encode special characters to avoid errors with rison', () => {
      expect(actions.encodeSearch({ searchTerm: 'number 19# (/) "', b: 'z' })).toBe(
        "?q=(b:z,searchTerm:'number 19%23 (%2F) %22')"
      );
    });
    it('should allow returning a rison query value, not appending the ?q= when other options may be found in the URL', () => {
      expect(actions.encodeSearch({ a: 1, b: 'z' }, false)).toBe('(a:1,b:z)');
    });
  });

  describe('Zoom functions', () => {
    it('should zoom in and out', () => {
      expect(actions.zoomIn()).toEqual({ type: types.ZOOM_IN });
      expect(actions.zoomOut()).toEqual({ type: types.ZOOM_OUT });
    });
  });

  describe('async action', () => {
    let dispatch;
    beforeEach(() => {
      backend.restore();
      backend
        .get(`${APIURL}search/match_title?searchTerm=batman`, {
          body: JSON.stringify(documentCollection),
        })
        .get(`${APIURL}search?searchTerm=batman`, { body: JSON.stringify(documentCollection) })
        .get(
          `${APIURL}search?searchTerm=batman` +
            '&filters=%7B%22author%22%3A%7B%22value%22%3A%22batman%22%2C%22type%22%3A%22text%22%7D%7D' +
            '&aggregations=%5B%5D' +
            '&types=%5B%22decision%22%5D',
          { body: JSON.stringify({ rows: documentCollection, aggregations }) }
        )
        .get(
          `${APIURL}search?searchTerm=batman&filters=%7B%7D&aggregations=%5B%5D&types=%5B%22decision%22%5D`,
          { body: JSON.stringify({ rows: documentCollection, aggregations }) }
        );
      dispatch = jasmine.createSpy('dispatch');
    });

    afterEach(() => backend.restore());

    describe('searchDocuments', () => {
      let store;
      let getState;
      let state;
      const storeKey = 'library';
      beforeEach(() => {
        state = {
          properties: [
            { name: 'author' },
            { name: 'inactive' },
            { name: 'date', type: 'date' },
            { name: 'select', type: 'select' },
            { name: 'multiselect', type: 'multiselect' },
            {
              name: 'nested',
              type: 'nested',
              nestedProperties: [{ key: 'prop1', label: 'prop one' }],
            },
            {
              name: 'relationshipfilter',
              type: 'relationshipfilter',
              filters: [
                { name: 'status', type: 'select' },
                { name: 'empty', type: 'date' },
              ],
            },
          ],
          documentTypes: ['decision'],
        };
        store = { library: { filters: Immutable.fromJS(state), search: { searchTerm: 'batman' } } };
        spyOn(browserHistory, 'getCurrentLocation').and.returnValue({
          pathname: '/library',
          query: { view: 'chart' },
          search: '?q=()',
        });
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
            nested: 'nestedValue',
            relationshipfilter: { status: { values: ['open'] }, empty: '' },
          },
        };

        const expectedQuery = {
          filters: {
            author: 'batman',
            date: 'dateValue',
            multiselect: 'multiValue',
            nested: 'nestedValue',
            relationshipfilter: { status: { values: ['open'] } },
            select: 'selectValue',
          },
          limit: 'limit',
          searchTerm: 'batman',
          sort: '_score',
          types: ['decision'],
        };

        spyOn(browserHistory, 'push');
        actions.searchDocuments({ search }, storeKey, 'limit')(dispatch, getState);
        let queryObject = rison.decode(
          browserHistory.push.calls.mostRecent().args[0].split('q=')[1]
        );
        expect(queryObject).toEqual(expectedQuery);

        search.filters.relationshipfilter.status.values = [];
        actions.searchDocuments({ search }, storeKey, 'limit')(dispatch, getState);
        queryObject = rison.decode(browserHistory.push.calls.mostRecent().args[0].split('q=')[1]);
        expect(queryObject.filters.relationshipfilter).not.toBeDefined();
      });

      it('should use passed filters when passed', () => {
        const search = {
          searchTerm: 'batman',
          filters: {
            author: 'batman',
            date: { from: null },
            select: 'selectValue',
            multiselect: { values: [] },
            nested: 'nestedValue',
            object: {},
          },
        };

        const { filters } = store.library;

        const limit = 'limit';
        spyOn(browserHistory, 'push');
        actions.searchDocuments({ search, filters }, storeKey, limit)(dispatch, getState);

        expect(browserHistory.push).toHaveBeenCalledWith(
          '/library/?view=chart&q=(filters:(author:batman,nested:nestedValue,select:selectValue),limit:limit,searchTerm:batman,sort:_score,types:!(decision))' //eslint-disable-line
        );
      });

      it('should set the storeKey selectedSorting if user has selected a custom sorting', () => {
        const expectedDispatch = {
          type: 'library.selectedSorting/SET',
          value: { searchTerm: 'batman', filters: { author: 'batman' }, userSelectedSorting: true },
        };
        spyOn(browserHistory, 'push');
        actions.searchDocuments(
          {
            search: {
              searchTerm: 'batman',
              filters: { author: 'batman' },
              userSelectedSorting: true,
            },
          },
          storeKey
        )(dispatch, getState);
        expect(dispatch).toHaveBeenCalledWith(expectedDispatch);
      });

      it('should set sort by relevance when the search term has changed and has value', () => {
        browserHistory.getCurrentLocation.and.returnValue({
          pathname: '/library',
          query: { view: 'chart' },
          search: '?q=(searchTerm:%27batman%20begings%27)',
        });
        spyOn(browserHistory, 'push');
        actions.searchDocuments(
          { search: { searchTerm: 'batman' }, filters: { properties: [] } },
          storeKey
        )(dispatch, getState);
        expect(browserHistory.push).toHaveBeenCalledWith(
          '/library/?view=chart&q=(limit:30,searchTerm:batman,sort:_score)'
        );
      });
    });

    describe('saveDocument', () => {
      it('should save the document and dispatch a notification on success', done => {
        mockID();
        spyOn(documentsApi, 'save').and.returnValue(Promise.resolve('response'));
        spyOn(referencesAPI, 'get').and.returnValue(Promise.resolve('response'));
        const doc = { name: 'doc' };

        const expectedActions = [
          {
            type: notificationsTypes.NOTIFY,
            notification: { message: 'Document updated', type: 'success', id: 'unique_id' },
          },
          { type: 'rrf/reset', model: 'library.sidepanel.metadata' },
          { type: types.UPDATE_DOCUMENT, doc: 'response' },
          { type: 'library.markers/UPDATE_IN', key: ['rows'], value: 'response' },
          { type: types.SELECT_SINGLE_DOCUMENT, doc: 'response' },
        ];
        const store = mockStore({});

        store
          .dispatch(actions.saveDocument(doc, 'library.sidepanel.metadata'))
          .then(() => {
            expect(documentsApi.save).toHaveBeenCalledWith(new RequestParams(doc));
            expect(store.getActions()).toEqual(expectedActions);
          })
          .then(done)
          .catch(done.fail);
      });
    });

    describe('multipleUpdate', () => {
      it('should update selected entities with the given metadata', async () => {
        mockID();
        const metadataResponse = { text: 'something new', rest_of_metadata: 'test' };
        spyOn(api, 'multipleUpdate').and.returnValue(
          Promise.resolve([
            { sharedId: '1', metadataResponse },
            { sharedId: '2', metadataResponse },
          ])
        );
        const entities = Immutable.fromJS([{ sharedId: '1' }, { sharedId: '2' }]);

        const expectedActions = [
          {
            type: notificationsTypes.NOTIFY,
            notification: { message: 'Update success', type: 'success', id: 'unique_id' },
          },
          {
            type: types.UPDATE_DOCUMENTS,
            docs: [
              { sharedId: '1', metadataResponse },
              { sharedId: '2', metadataResponse },
            ],
          },
        ];
        const store = mockStore({});
        const changes = { property_changes: 'change' };
        await store.dispatch(actions.multipleUpdate(entities, { metadata: changes }));
        expect(api.multipleUpdate).toHaveBeenCalledWith(
          new RequestParams({ ids: ['1', '2'], values: { metadata: changes } })
        );
        expect(store.getActions()).toEqual(expectedActions);
      });
    });

    describe('deleteDocument', () => {
      it('should delete the document and dispatch a notification on success', done => {
        mockID();
        spyOn(documentsApi, 'delete').and.returnValue(Promise.resolve('response'));
        const doc = { sharedId: 'sharedId', name: 'doc' };

        const expectedActions = [
          {
            type: notificationsTypes.NOTIFY,
            notification: { message: 'Document deleted', type: 'success', id: 'unique_id' },
          },
          { type: types.UNSELECT_ALL_DOCUMENTS },
          { type: types.REMOVE_DOCUMENT, doc },
        ];
        const store = mockStore({});

        store
          .dispatch(actions.deleteDocument(doc))
          .then(() => {
            expect(documentsApi.delete).toHaveBeenCalledWith(
              new RequestParams({ sharedId: doc.sharedId })
            );
            expect(store.getActions()).toEqual(expectedActions);
          })
          .then(done)
          .catch(done.fail);
      });
    });

    describe('searchSnippets', () => {
      it('should search snippets for the searchTerm', done => {
        spyOn(SearchApi, 'searchSnippets').and.returnValue(Promise.resolve('response'));

        const expectedActions = [{ type: 'storeKey.sidepanel.snippets/SET', value: 'response' }];

        const store = mockStore({ locale: 'es' });

        store
          .dispatch(actions.searchSnippets('query', 'sharedId', 'storeKey'))
          .then(snippets => {
            expect(snippets).toBe('response');
            expect(SearchApi.searchSnippets).toHaveBeenCalledWith(
              new RequestParams({ searchTerm: 'query', id: 'sharedId' })
            );
            expect(store.getActions()).toEqual(expectedActions);
          })
          .then(done)
          .catch(done.fail);
      });
    });

    describe('getDocumentReferences', () => {
      it('should set the library sidepanel references', done => {
        mockID();
        spyOn(referencesAPI, 'get').and.returnValue(Promise.resolve('referencesResponse'));

        const expectedActions = [
          { type: 'library.sidepanel.references/SET', value: 'referencesResponse' },
        ];

        const store = mockStore({ locale: 'es' });

        store
          .dispatch(actions.getDocumentReferences('id', 'library'))
          .then(() => {
            expect(referencesAPI.get).toHaveBeenCalledWith(new RequestParams({ sharedId: 'id' }));
            expect(store.getActions()).toEqual(expectedActions);
          })
          .then(done)
          .catch(done.fail);
      });
    });

    describe('selectDocument', () => {
      describe('when the doc has not semantic search but the active sidepanel tab is semantic search', () => {
        it('should reset the active sidepanel tab', () => {
          const doc = { sharedId: 'doc' };

          const store = mockStore({ library: { sidepanel: { tab: 'semantic-search-results' } } });
          store.dispatch(actions.selectDocument(doc));
          expect(store.getActions()).toMatchSnapshot();
        });
      });
    });
  });

  describe('saveEntity', () => {
    it('should save the document and dispatch a notification on success', done => {
      mockID();
      spyOn(api, 'save').and.returnValue(Promise.resolve('response'));
      spyOn(referencesAPI, 'get').and.returnValue(Promise.resolve('response'));
      const doc = { name: 'doc' };

      const expectedActions = [
        { model: 'library.sidepanel.metadata', type: 'rrf/reset' },
        { type: 'UNSELECT_ALL_DOCUMENTS' },
        {
          notification: {
            id: 'unique_id',
            message: 'Entity created',
            type: 'success',
          },
          type: 'NOTIFY',
        },
        { doc: 'response', type: 'ELEMENT_CREATED' },
        { doc: 'response', type: 'SELECT_SINGLE_DOCUMENT' },
      ];
      const store = mockStore({});

      store
        .dispatch(actions.saveEntity(doc, 'library.sidepanel.metadata'))
        .then(() => {
          expect(api.save).toHaveBeenCalledWith(new RequestParams(doc));
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
    });
  });
});
