/**
 * @jest-environment jsdom
 */
import backend from 'fetch-mock';
import qs from 'qs';
import Immutable from 'immutable';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import rison from 'rison-node';
import { APIURL } from 'app/config.js';
import { RequestParams } from 'app/utils/RequestParams';
import * as types from 'app/Library/actions/actionTypes';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';
import * as actions from 'app/Library/actions/libraryActions';
import { documentsApi } from 'app/Documents';
import { mockID } from 'shared/uniqueID.js';

import { api } from 'app/Entities';
import referencesAPI from 'app/Viewer/referencesAPI';
import SearchApi from 'app/Search/SearchAPI';
import * as saveEntityWithFiles from '../saveEntityWithFiles';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('libraryActions', () => {
  const documentCollection = [{ name: 'Secret list of things' }];
  const aggregations = [{ prop: { buckets: [] } }];
  const templates = [{ name: 'Decision' }, { name: 'Ruling' }];
  const thesauris = [{ _id: 'abc1' }];
  let getState;
  let location;
  const navigate = jest.fn();

  describe('setDocuments', () => {
    it('should return a SET_DOCUMENTS action ', () => {
      const action = actions.setDocuments(documentCollection);
      expect(action).toEqual({ type: types.SET_DOCUMENTS, documents: documentCollection });
    });
  });

  describe('setTemplates', () => {
    const documentTypes = ['typea'];
    let dispatch;
    const filters = {
      documentTypes,
      properties: ['library properties'],
    };

    beforeEach(() => {
      dispatch = jasmine.createSpy('dispatch');
      getState = jasmine.createSpy('getState').and.returnValue({
        settings: {
          collection: Immutable.Map({}),
        },
        library: { filters: Immutable.fromJS(filters), search: {} },
      });
      jest.clearAllMocks();
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

    it('should keep the search term inside single quotes to avoid errors with rison', () => {
      const toCode = {
        searchTerm: 'a:b',
        sort: '_score',
        order: 'desc',
        includeUnpublished: false,
        unpublished: false,
        allAggregations: false,
      };
      const encodedSearch = actions.encodeSearch(toCode, false);
      const coded =
        "(allAggregations:!f,includeUnpublished:!f,order:desc,searchTerm:'a%3Ab',sort:_score,unpublished:!f)";
      expect(encodedSearch).toBe(coded);
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
      let state;
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
        store = {
          settings: {
            collection: Immutable.Map({}),
          },
          library: {
            filters: Immutable.fromJS(state),
            search: {
              searchTerm: 'batman',
              customFilters: { property: { values: ['value'] } },
              filters: {},
            },
          },
        };
        location = {
          pathname: '/library',
          search: '?q=()',
        };
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
          limit: 30,
          from: 0,
          searchTerm: 'batman',
          sort: '_score',
          types: ['decision'],
        };

        actions.searchDocuments({ search, location, navigate }, 30)(dispatch, getState);
        let queryObject = rison.decode(navigate.mock.calls[0][0].split('q=')[1]);
        expect(queryObject).toEqual(expectedQuery);

        search.filters.relationshipfilter.status.values = [];
        actions.searchDocuments({ search, location, navigate }, 'limit')(dispatch, getState);
        queryObject = rison.decode(navigate.mock.calls[1][0].split('q=')[1]);
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

        const limit = 60;
        actions.searchDocuments({ search, location, navigate, filters }, limit)(dispatch, getState);

        expect(navigate).toHaveBeenCalledWith(
          "/library/?q=(filters:(author:batman,nested:nestedValue,select:selectValue),from:0,limit:60,searchTerm:'batman',sort:_score,types:!(decision))" //eslint-disable-line
        );
      });

      it('should use customFilters from the current search on the store', () => {
        const limit = 60;

        navigate.mockClear();
        actions.searchDocuments({ location, navigate }, limit)(dispatch, getState);

        expect(navigate).toHaveBeenCalledWith(
          "/library/?q=(customFilters:(property:(values:!(value))),filters:(),from:0,limit:60,searchTerm:'batman',sort:_score,types:!(decision))" //eslint-disable-line
        );
      });

      it('should set the storeKey selectedSorting if user has selected a custom sorting', () => {
        const expectedDispatch = {
          type: 'library.selectedSorting/SET',
          value: { searchTerm: 'batman', filters: { author: 'batman' }, userSelectedSorting: true },
        };
        actions.searchDocuments({
          search: {
            searchTerm: 'batman',
            filters: { author: 'batman' },
            userSelectedSorting: true,
          },
          location,
          navigate,
        })(dispatch, getState);
        expect(dispatch).toHaveBeenCalledWith(expectedDispatch);
      });

      it('should set sort by relevance when the search term has changed and has value', () => {
        location = {
          pathname: '/library',
          search: '?q=(searchTerm:%27batman%20begings%27)',
        };
        actions.searchDocuments({
          search: { searchTerm: 'batman' },
          location,
          navigate,
          filters: { properties: [] },
        })(dispatch, getState);
        expect(navigate).toHaveBeenCalledWith(
          "/library/?q=(from:0,limit:30,searchTerm:'batman',sort:_score)"
        );
      });

      it('should respect the sorting criteria when the search term has not changed and has value', () => {
        location = {
          pathname: '/library',
          search: '?q=(searchTerm:%27batman%27)',
        };

        actions.searchDocuments({
          search: { searchTerm: 'batman', sort: 'title', order: 'desc' },
          location,
          navigate,
          filters: { properties: [] },
        })(dispatch, getState);
        expect(navigate).toHaveBeenCalledWith(
          "/library/?q=(from:0,limit:30,order:desc,searchTerm:'batman',sort:title)"
        );
      });
    });

    describe('saveDocument', () => {
      it('should save the document and dispatch a notification on success', done => {
        mockID();
        spyOn(documentsApi, 'save').and.callFake(async () => Promise.resolve('response'));
        const doc = { name: 'doc' };

        const expectedActions = [
          {
            type: notificationsTypes.NOTIFY,
            notification: { message: 'Entity updated', type: 'success', id: 'unique_id' },
          },
          { type: 'rrf/reset', model: 'library.sidepanel.metadata' },
          { type: types.UPDATE_DOCUMENT, doc: 'response' },
          { type: 'library.markers/UPDATE_IN', key: ['rows'], value: 'response', customIndex: '' },
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
        spyOn(documentsApi, 'delete').and.callFake(async () => Promise.resolve('response'));
        const doc = { sharedId: 'sharedId', name: 'doc' };

        const expectedActions = [
          {
            type: notificationsTypes.NOTIFY,
            notification: { message: 'Entity deleted', type: 'success', id: 'unique_id' },
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
      it('should search snippets for the searchTerm', async () => {
        spyOn(SearchApi, 'searchSnippets').and.returnValue(
          Promise.resolve({ data: [{ snippets: [] }] })
        );

        const expectedActions = [{ type: 'storeKey.sidepanel.snippets/SET', value: [] }];
        const store = mockStore({ locale: 'es' });
        const snippets = await store.dispatch(
          actions.searchSnippets('query', 'sharedId', 'storeKey')
        );

        expect(snippets).toEqual([]);
        const expectedParam = qs.stringify({
          filter: { sharedId: 'sharedId', searchString: 'query' },
          fields: ['snippets'],
        });
        expect(SearchApi.searchSnippets).toHaveBeenCalledWith(new RequestParams(expectedParam));
        expect(store.getActions()).toEqual(expectedActions);
      });
    });

    describe('getDocumentReferences', () => {
      it('should set the library sidepanel references', done => {
        mockID();
        spyOn(referencesAPI, 'get').and.callFake(async () => Promise.resolve('referencesResponse'));

        const expectedActions = [
          { type: 'library.sidepanel.references/SET', value: 'referencesResponse' },
          { type: 'relationships/list/sharedId/SET', value: 'id' },
        ];

        const store = mockStore({ locale: 'es' });

        store
          .dispatch(actions.getDocumentReferences('id', 'fileId', 'library'))
          .then(() => {
            expect(referencesAPI.get).toHaveBeenCalledWith(
              new RequestParams({ file: 'fileId', onlyTextReferences: true, sharedId: 'id' })
            );
            expect(store.getActions()).toEqual(expectedActions);
          })
          .then(done)
          .catch(done.fail);
      });
    });

    describe('selectDocument', () => {
      describe('when the doc has not semantic search but the active sidepanel tab is semantic search', () => {
        it('should reset the active sidepanel tab', async () => {
          const doc = { sharedId: 'doc' };

          const store = mockStore({ library: { sidepanel: { tab: 'semantic-search-results' } } });
          await store.dispatch(actions.selectDocument(doc));
          expect(store.getActions()).toMatchSnapshot();
        });
      });
    });
  });

  describe('saveEntity', () => {
    it('should save the document and dispatch a notification on success', async () => {
      mockID();
      const doc = { name: 'entity1' };
      spyOn(saveEntityWithFiles, 'saveEntityWithFiles').and.returnValue({
        entity: doc,
        errors: '',
      });

      const expectedActions = [
        { model: 'library.sidepanel.metadata', type: 'rrf/reset' },
        { type: 'UNSELECT_ALL_DOCUMENTS' },
        { doc: { name: 'entity1' }, type: 'ELEMENT_CREATED' },
        {
          notification: {
            id: 'unique_id',
            message: 'Entity created',
            type: 'success',
          },
          type: 'NOTIFY',
        },
        { doc: { name: 'entity1' }, type: 'SELECT_SINGLE_DOCUMENT' },
      ];
      const store = mockStore({});
      await store.dispatch(actions.saveEntity(doc, 'library.sidepanel.metadata'));
      expect(saveEntityWithFiles.saveEntityWithFiles).toHaveBeenCalledWith(
        doc,
        expect.any(Function)
      );
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
