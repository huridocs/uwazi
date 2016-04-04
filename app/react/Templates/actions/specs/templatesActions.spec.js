import backend from 'fetch-mock';
import {APIURL} from 'app/config.js';

import * as actions from 'app/Templates/actions/templatesActions';
import * as types from 'app/Templates/actions/actionTypes';

describe('templatesActions', () => {
  describe('setTemplates', () => {
    it('should return a SET_TEMPLATES type with templates passed', () => {
      let templates = 'templates';
      let action = actions.setTemplates(templates);
      expect(action).toEqual({type: types.SET_TEMPLATES, templates: 'templates'});
    });
  });

  describe('async actions', () => {
    let dispatch;
    beforeEach(() => {
      backend.restore();
      backend
      .mock(APIURL + 'templates', 'delete', {body: JSON.stringify({testBackendResult: 'ok'})});
      dispatch = jasmine.createSpy('dispatch');
    });

    describe('deleteTemplate', () => {
      it('should delete the template and dispatch a DELETE_TEMPLATE action with the template id', (done) => {
        let template = {_id: 'templateId', _rev: 'rev'};

        actions.deleteTemplate(template)(dispatch)
        .then(() => {
          expect(dispatch).toHaveBeenCalledWith({type: types.DELETE_TEMPLATE, id: 'templateId'});
          done();
        });

        expect(JSON.parse(backend.lastOptions(APIURL + 'templates').body)).toEqual(template);
      });
    });
  });
});
