import backend from 'fetch-mock';
import {APIURL} from 'app/config.js';

import * as actions from 'app/Library/actions/libraryActions';
import * as types from 'app/Library/actions/actionTypes';

describe('libraryActions', () => {
  let documents = [{name: 'Secret list of things'}];

  describe('setDocuments', () => {
    it('should return a SET_DOCUMENTS action ', () => {
      let action = actions.setDocuments(documents);
      expect(action).toEqual({type: types.SET_DOCUMENTS, documents});
    });
  });

  describe('setSearchTerm', () => {
    it('should return a SET_SEARCHTERM action ', () => {
      let action = actions.setSearchTerm('Zerg Rush');
      expect(action).toEqual({type: types.SET_SEARCHTERM, searchTerm: 'Zerg Rush'});
    });
  });

  describe('setPreviewDoc', () => {
    it('should return a SET_PREVIEW_DOC action ', () => {
      let action = actions.setPreviewDoc('id');
      expect(action).toEqual({type: types.SET_PREVIEW_DOC, docId: 'id'});
    });
  });

  describe('async action', () => {
    let dispatch;
    beforeEach(() => {
      backend.restore();
      backend
      .mock(APIURL + 'documents/search?searchTerm=batman', 'get', {body: JSON.stringify(documents)});
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
    });
  });
});
