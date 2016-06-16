import backend from 'fetch-mock';
import {APIURL} from 'app/config.js';

import * as actions from 'app/Thesauris/actions/thesaurisActions';
import * as types from 'app/Thesauris/actions/actionTypes';
import {actions as formActions} from 'react-redux-form';

describe('thesaurisActions', () => {
  describe('editThesauri', () => {
    it('should set the thesauri in the form ', () => {
      let thesauri = {name: 'Secret list of things', values: []};
      let dispatch = jasmine.createSpy('dispatch');
      spyOn(formActions, 'load');
      actions.editThesauri(thesauri)(dispatch);
    
      expect(formActions.load).toHaveBeenCalledWith('thesauri.data', thesauri);
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
      .mock(APIURL + 'thesauris?_id=thesauriId', 'delete', {body: JSON.stringify({testBackendResult: 'ok'})});
      dispatch = jasmine.createSpy('dispatch');
    });

    describe('deleteThesauri', () => {
      it('should delete the thesauri and dispatch a THESAURI_DELETED action with the id', (done) => {
        let thesauri = {_id: 'thesauriId'};
        actions.deleteThesauri(thesauri)(dispatch)
        .then(() => {
          expect(dispatch).toHaveBeenCalledWith({type: types.THESAURI_DELETED, id: 'thesauriId'});
          done();
        });
      });
    });
  });
});
