import backend from 'fetch-mock';
import {APIURL} from '~/config.js';

import * as actions from '~/Thesauris/actions/thesauriActions';
import * as types from '~/Thesauris/actions/actionTypes';

describe('thesaurisActions', () => {
  describe('addValue', () => {
    it('should return an action of type ADD_THESAURI_VALUE', () => {
      let action = actions.addValue();
      expect(action).toEqual({type: types.ADD_THESAURI_VALUE});
    });
  });

  // describe('async actions', () => {
  //   let dispatch;
  //   beforeEach(() => {
  //     backend.restore();
  //     backend
  //     .mock(APIURL + 'templates', 'delete', {body: JSON.stringify({testBackendResult: 'ok'})});
  //     dispatch = jasmine.createSpy('dispatch');
  //   });
  //
  //   describe('deleteTemplate', () => {
  //     it('should delete the template and dispatch a DELETE_TEMPLATE action with the template id', (done) => {
  //       let template = {_id: 'templateId', _rev: 'rev'};
  //
  //       actions.deleteTemplate(template)(dispatch)
  //       .then(() => {
  //         expect(dispatch).toHaveBeenCalledWith({type: types.DELETE_TEMPLATE, id: 'templateId'});
  //         done();
  //       });
  //
  //       expect(JSON.parse(backend.lastOptions(APIURL + 'templates').body)).toEqual(template);
  //     });
  //   });
  // });
});
