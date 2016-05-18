import backend from 'fetch-mock';
import {APIURL} from 'app/config.js';
import Immutable from 'immutable';

import * as actions from 'app/Library/actions/libraryActions';
import * as types from 'app/Library/actions/actionTypes';

import libraryHelper from 'app/Library/helpers/libraryFilters';

describe('libraryActions', () => {
  let documents = [{name: 'Secret list of things'}];
  let templates = [{name: 'Decision'}, {name: 'Ruling'}];
  let thesauris = [{_id: 'abc1'}];

  describe('setDocuments', () => {
    it('should return a SET_DOCUMENTS action ', () => {
      let action = actions.setDocuments(documents);
      expect(action).toEqual({type: types.SET_DOCUMENTS, documents});
    });
  });

  describe('setTemplates', () => {
    let documentTypes = 'generated document types';
    let libraryFilters = 'generated filters';

    beforeEach(() => {
      spyOn(libraryHelper, 'generateDocumentTypes').and.returnValue(documentTypes);
      spyOn(libraryHelper, 'libraryFilters').and.returnValue(libraryFilters);
    });

    it('should return a SET_LIBRARY_TEMPLATES action ', () => {
      let action = actions.setTemplates(templates, thesauris);
      expect(libraryHelper.generateDocumentTypes).toHaveBeenCalledWith(templates);
      expect(libraryHelper.libraryFilters).toHaveBeenCalledWith(templates, 'generated document types', thesauris);
      expect(action).toEqual({type: types.SET_LIBRARY_TEMPLATES, templates, thesauris, documentTypes, libraryFilters});
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
      .mock(APIURL + 'documents/match_title?searchTerm=batman', 'get', {body: JSON.stringify(documents)})
      .mock(APIURL + 'documents/search?searchTerm=batman', 'get', {body: JSON.stringify(documents)})
      .mock(APIURL + 'documents/search?searchTerm=batman&filters=%7B%22author%22%3A%22batman%22%7D', 'get', {body: JSON.stringify(documents)})
      .mock(APIURL + 'documents/search?searchTerm=batman&filters=%7B%7D', 'get', {body: JSON.stringify(documents)});
      dispatch = jasmine.createSpy('dispatch');
    });

    // describe('searchDocuments', () => {
    //   let store;
    //   let getState;
    //   let state;
    //   beforeEach(() => {
    //     state = {properties: [{name: 'author', active: true}]};
    //     store = {library: {filters: Immutable.fromJS(state)}};
    //     getState = jasmine.createSpy('getState').and.returnValue(store);
    //   });
    //
    //   it('should perform a search and return a SET_DOCUMENTS action with the result ', (done) => {
    //     actions.searchDocuments({searchTerm: 'batman', filters: {author: 'batman'}})(dispatch, getState)
    //     .then(() => {
    //       expect(backend.called(APIURL + 'documents/search?searchTerm=batman&filters=%7B%22author%22%3A%22batman%22%7D')).toBe(true);
    //       expect(dispatch).toHaveBeenCalledWith({type: types.SET_DOCUMENTS, documents});
    //       done();
    //     })
    //     .catch(done.fail);
    //   });
    //
    //   it('should remove from the search the filters that are not active', (done) => {
    //     state.properties[0].active = false;
    //     store.library.filters = Immutable.fromJS(state);
    //     actions.searchDocuments({searchTerm: 'batman', filters: {author: 'batman'}})(dispatch, getState)
    //     .then(() => {
    //       expect(backend.called(APIURL + 'documents/search?searchTerm=batman&filters=%7B%7D')).toBe(true);
    //       expect(dispatch).toHaveBeenCalledWith({type: types.SET_DOCUMENTS, documents});
    //       done();
    //     })
    //     .catch(done.fail);
    //   });

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
          expect(dispatch).toHaveBeenCalledWith({type: types.SET_SUGGESTIONS, suggestions: documents});
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
  });
});
