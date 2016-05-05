import Immutable from 'immutable';
import * as types from 'app/Uploads/actions/actionTypes';

import templatesReducer from 'app/Uploads/reducers/templatesReducer';
import 'jasmine-immutablejs-matchers';

describe('uploadsReducer', () => {
  const initialState = Immutable.fromJS([]);

  describe('when state is undefined', () => {
    it('returns default state', () => {
      let newState = templatesReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('SET_TEMPLATES_UPLOADS', () => {
    it('should set the templates in the state', () => {
      let templates = [{title: 'Song of Ice and Fire: The Winds of Winter'}, {title: 'Song of Ice and Fire: A Dream of Spring'}];
      let newState = templatesReducer(initialState, {type: types.SET_TEMPLATES_UPLOADS, templates});
      expect(newState).toEqualImmutable(Immutable.fromJS(templates));
    });
  });
});
