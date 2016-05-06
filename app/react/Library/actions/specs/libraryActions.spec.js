import backend from 'fetch-mock';
import {APIURL} from 'app/config.js';

import * as actions from 'app/Library/actions/libraryActions';
import * as types from 'app/Library/actions/actionTypes';

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
    it('should return a SET_TEMPLATES action ', () => {
      let action = actions.setTemplates(templates, thesauris);
      expect(action).toEqual({type: types.SET_TEMPLATES, templates, thesauris});
    });
  });

  describe('enterLirabry', () => {
    it('should return a ENTER_LIBRARY action ', () => {
      let action = actions.enterLibrary();
      expect(action).toEqual({type: types.ENTER_LIBRARY});
    });
  });

  describe('setSearchTerm', () => {
    it('should return a SET_SEARCHTERM action ', () => {
      let action = actions.setSearchTerm('Zerg Rush');
      expect(action).toEqual({type: types.SET_SEARCHTERM, searchTerm: 'Zerg Rush'});
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
      .mock(APIURL + 'documents/search?joker=true&searchTerm=batman', 'get', {body: JSON.stringify(documents)});
      dispatch = jasmine.createSpy('dispatch');
    });

    describe('searchDocuments', () => {
      it('should perform a search and return a SET_DOCUMENTS action with the result ', (done) => {
        actions.searchDocuments('batman')(dispatch)
        .then(() => {
          expect(dispatch).toHaveBeenCalledWith({type: types.SET_DOCUMENTS, documents});
          done();
        })
        .catch(done.fail);
      });

      it('should be able to handle filters', (done) => {
        actions.searchDocuments('batman', {joker: true})(dispatch)
        .then(() => {
          expect(backend.called(APIURL + 'documents/search?joker=true&searchTerm=batman')).toBe(true);
          expect(dispatch).toHaveBeenCalledWith({type: types.SET_DOCUMENTS, documents});
          done();
        })
        .catch(done.fail);
      });

      it('should dispatch a HIDE_SUGGESTIONS action', (done) => {
        actions.searchDocuments('batman')(dispatch)
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
