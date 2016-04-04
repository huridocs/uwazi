import backend from 'fetch-mock';
import {APIURL} from '~/config.js';

import * as actions from '~/Thesauris/actions/thesauriActions';
import * as types from '~/Thesauris/actions/actionTypes';

describe('thesaurisActions', () => {
  let dispatch;
  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'thesauris', 'post', {body: JSON.stringify({testBackendResult: 'ok'})});
    dispatch = jasmine.createSpy('dispatch');
  });

  describe('saveThesauri', () => {
    it('should save the thesauri and dispatch a thesauriSaved action', (done) => {
      let thesauri = {name: 'Secret list of things', values: []};
      actions.saveThesauri(thesauri)(dispatch)
      .then(() => {
        expect(dispatch).toHaveBeenCalledWith({type: types.THESAURI_SAVED});
        done();
      });

      expect(JSON.parse(backend.lastOptions(APIURL + 'thesauris').body)).toEqual(thesauri);
    });
  });

  describe('resetThesauri', () => {
    it('should return a RESET_THESAURI action', () => {
      let action = actions.resetThesauri();
      expect(action).toEqual({type: types.RESET_THESAURI});
    });
  });
});
