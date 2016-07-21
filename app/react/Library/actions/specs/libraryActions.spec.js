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

import libraryHelper from 'app/Library/helpers/libraryFilters';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('libraryActions', () => {
  let documentCollection = [{name: 'Secret list of things'}];
  let templates = [{name: 'Decision'}, {name: 'Ruling'}];
  let thesauris = [{_id: 'abc1'}];

  describe('setDocuments', () => {
    it('should return a SET_DOCUMENTS action ', () => {
      let action = actions.setDocuments(documentCollection);
      expect(action).toEqual({type: types.SET_DOCUMENTS, documents: documentCollection});
    });
  });

  describe('setTemplates', () => {
    let documentTypes = {typea: true, typeb: false};
    let libraryFilters = 'generated filters';
    let dispatch;
    let getState;
    let filters = {
      documentTypes,
      properties: ['library properties']
    };

    beforeEach(() => {
      spyOn(libraryHelper, 'generateDocumentTypes').and.returnValue(documentTypes);
      spyOn(libraryHelper, 'libraryFilters').and.returnValue(libraryFilters);
      dispatch = jasmine.createSpy('dispatch');
      getState = jasmine.createSpy('getState').and.returnValue({library: {filters: Immutable.fromJS(filters)}});
    });

    it('should dispatch a SET_LIBRARY_TEMPLATES action ', () => {
      actions.setTemplates(templates, thesauris)(dispatch, getState);
      expect(libraryHelper.generateDocumentTypes).toHaveBeenCalledWith(templates);
      expect(dispatch).toHaveBeenCalledWith({
        type: types.SET_LIBRARY_TEMPLATES,
        templates, thesauris, documentTypes,
        libraryFilters: ['library properties']
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
      .mock(APIURL + 'documents/match_title?searchTerm=batman', 'get', {body: JSON.stringify(documentCollection)})
      .mock(APIURL + 'documents/search?searchTerm=batman', 'get', {body: JSON.stringify(documentCollection)})
      .mock(APIURL + 'documents/search?searchTerm=batman&filters=%7B%22author%22%3A%22batman%22%7D&types=%5B%22decision%22%5D', 'get',
            {body: JSON.stringify(documentCollection)}
           )
      .mock(APIURL + 'documents/search?searchTerm=batman&filters=%7B%7D&types=%5B%22decision%22%5D', 'get',
            {body: JSON.stringify(documentCollection)});
      dispatch = jasmine.createSpy('dispatch');
    });

    describe('searchDocuments', () => {
      let store;
      let getState;
      let state;
      beforeEach(() => {
        state = {properties: [{name: 'author', active: true}], documentTypes: {decision: true, ruling: false}};
        store = {library: {filters: Immutable.fromJS(state)}};
        getState = jasmine.createSpy('getState').and.returnValue(store);
      });

      it('should perform a search and return a SET_DOCUMENTS action with the result ', (done) => {
        actions.searchDocuments({searchTerm: 'batman', filters: {author: 'batman'}})(dispatch, getState)
        .then(() => {
          expect(backend.called(APIURL + 'documents/search?searchTerm=batman&filters=%7B%22author%22%3A%22batman%22%7D&types=%5B%22decision%22%5D'))
          .toBe(true);
          expect(dispatch).toHaveBeenCalledWith({type: types.SET_DOCUMENTS, documents: documentCollection});
          done();
        })
        .catch(done.fail);
      });

      it('should remove from the search the filters that are not active', (done) => {
        state.properties[0].active = false;
        store.library.filters = Immutable.fromJS(state);
        actions.searchDocuments({searchTerm: 'batman', filters: {author: 'batman'}})(dispatch, getState)
        .then(() => {
          expect(backend.called(APIURL + 'documents/search?searchTerm=batman&filters=%7B%7D&types=%5B%22decision%22%5D')).toBe(true);
          expect(dispatch).toHaveBeenCalledWith({type: types.SET_DOCUMENTS, documents: documentCollection});
          done();
        })
        .catch(done.fail);
      });

      it('should dispatch a HIDE_SUGGESTIONS action', (done) => {
        actions.searchDocuments({searchTerm: 'batman'})(dispatch, getState)
        .then(() => {
          expect(dispatch).toHaveBeenCalledWith({type: types.HIDE_SUGGESTIONS});
          done();
        })
        .catch(done.fail);
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
        let doc = {name: 'doc'};

        const expectedActions = [
          {type: notificationsTypes.NOTIFY, notification: {message: 'Document updated', type: 'success', id: 'unique_id'}},
          {type: 'rrf/reset', model: 'library.docForm'},
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

    describe('deleteDocument', () => {
      it('should delete the document and dispatch a notification on success', (done) => {
        mockID();
        spyOn(documents.api, 'delete').and.returnValue(Promise.resolve('response'));
        let doc = {name: 'doc'};

        const expectedActions = [
          {type: notificationsTypes.NOTIFY, notification: {message: 'Document deleted', type: 'success', id: 'unique_id'}},
          {type: types.UNSELECT_DOCUMENT},
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
  });
});
