import backend from 'fetch-mock';
import {APIURL} from 'app/config.js';

import * as actions from 'app/Thesauris/actions/thesaurisActions';
import * as types from 'app/Thesauris/actions/actionTypes';

describe('thesaurisActions', () => {
  describe('editThesauri', () => {
    it('should return an EDIT_THESAURI action ', () => {
      let thesauri = {name: 'Secret list of things', values: []};
      let action = actions.editThesauri(thesauri);
      expect(action).toEqual({type: types.EDIT_THESAURI, thesauri});
    });
  });

  describe('setThesauris', () => {
    it('should return an SET_THESAURIS action ', () => {
      let thesauris = [{name: 'Secret list of things', values: []}];
      let action = actions.setThesauris(thesauris);
      expect(action).toEqual({type: types.SET_THESAURIS, thesauris});
    });
  });

  describe('async action', () => {
    let dispatch;

    beforeEach(() => {
      backend.restore();
      backend
      .mock(APIURL + 'thesauris', 'delete', {body: JSON.stringify({testBackendResult: 'ok'})});
      dispatch = jasmine.createSpy('dispatch');
    });

    describe('deleteThesauri', () => {
      it('should delete the thesauri and dispatch a THESAURI_DELETED action with the id', (done) => {
        let thesauri = {_id: 'thesauriId', name: 'Secret list of things', values: []};
        actions.deleteThesauri(thesauri)(dispatch)
        .then(() => {
          expect(dispatch).toHaveBeenCalledWith({type: types.THESAURI_DELETED, id: 'thesauriId'});
          done();
        });

        expect(JSON.parse(backend.lastOptions(APIURL + 'thesauris').body)).toEqual(thesauri);
      });
    });
  });
});
