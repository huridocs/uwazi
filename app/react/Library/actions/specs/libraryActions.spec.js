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
import {toUrlParams} from 'shared/JSONRequest';

import referencesAPI from 'app/Viewer/referencesAPI';
import referencesUtils from 'app/Viewer/utils/referencesUtils';

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
      getState = jasmine.createSpy('getState').and.returnValue({library: {filters: Immutable.fromJS(filters)}});
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
      beforeEach(() => {
        state = {properties: [
          {name: 'author', active: true},
          {name: 'inactive'},
          {name: 'date', type: 'date', active: true},
          {name: 'select', type: 'select', active: true},
          {name: 'multiselect', type: 'multiselect', active: true},
          {name: 'nested', type: 'nested', active: true, nestedProperties: [{key: 'prop1', label: 'prop one'}]}
        ], documentTypes: ['decision']};
        store = {library: {filters: Immutable.fromJS(state)}};
        getState = jasmine.createSpy('getState').and.returnValue(store);
      });

      it('should convert the search and set it to the url query', () => {
        const query = {
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
        spyOn(browserHistory, 'getCurrentLocation').and.returnValue({pathname: '/library'});
        actions.searchDocuments(query, limit)(dispatch, getState);
        const expected = Object.assign({}, query);
        expected.aggregations = [
          {name: 'select', nested: false},
          {name: 'multiselect', nested: false},
          {name: 'nested', nested: true, nestedProperties: [{key: 'prop1', label: 'prop one'}]}
        ];
        expected.filters = {
          author: {value: 'batman', type: 'text'},
          date: {value: 'dateValue', type: 'range'},
          select: {value: 'selectValue', type: 'multiselect'},
          multiselect: {value: 'multiValue', type: 'multiselect'},
          nested: {value: 'nestedValue', type: 'nested'}
        };
        expected.types = ['decision'];
        expected.limit = limit;

        expect(browserHistory.push).toHaveBeenCalledWith(`/library/${toUrlParams(expected)}`);
      });

      it('should dispatch a HIDE_SUGGESTIONS action', () => {
        actions.searchDocuments({searchTerm: 'batman', filters: {author: 'batman'}})(dispatch, getState);
        expect(dispatch).toHaveBeenCalledWith({type: types.HIDE_SUGGESTIONS});
      });
    });

    describe('getSuggestions', () => {
      it('should perform a search and dispatch a SET_SUGGESTIONS action with the result ', (done) => {
        actions.getSuggestions('batman')(dispatch)
        .then(() => {
          expect(dispatch).toHaveBeenCalledWith({type: types.SET_SUGGESTIONS, suggestions: documentCollection});
          done();
        })
        .catch(done.fail);
      });

      it('should dispatch a SHOW_SUGGESTIONS action', (done) => {
        actions.getSuggestions('batman')(dispatch)
        .then(() => {
          expect(dispatch).toHaveBeenCalledWith({type: types.SHOW_SUGGESTIONS});
          done();
        })
        .catch(done.fail);
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
          {type: types.SELECT_DOCUMENT, doc: 'response'}
        ];
        const store = mockStore({});

        store.dispatch(actions.saveDocument(doc))
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

    describe('getDocumentReferences', () => {
      it('should set the library sidepanel references', (done) => {
        mockID();
        spyOn(referencesAPI, 'get').and.returnValue(Promise.resolve('response'));
        spyOn(referencesUtils, 'filterRelevant').and.callFake((references, locale) => 'relevantReferences for ' + references + ', ' + locale);

        const expectedActions = [
          {type: 'library.sidepanel.references/SET', value: 'relevantReferences for response, es'}
        ];

        const store = mockStore({locale: 'es'});

        store.dispatch(actions.getDocumentReferences('id'))
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
