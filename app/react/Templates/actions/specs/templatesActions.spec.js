import * as actions from '~/Templates/actions/templatesActions';
import * as types from '~/Templates/actions/actionTypes';

describe('templatesActions', () => {
  describe('setTemplates', () => {
    it('should return a SET_TEMPLATES type with templates passed', () => {
      let templates = 'templates';
      let action = actions.setTemplates(templates);
      expect(action).toEqual({type: types.SET_TEMPLATES, templates: 'templates'});
    });
  });
});
