import Immutable from 'immutable';
import * as types from 'app/Uploads/actions/actionTypes';

import thesaurisReducer from 'app/Uploads/reducers/thesaurisReducer';
import 'jasmine-immutablejs-matchers';

describe('uploadsReducer', () => {
  const initialState = Immutable.fromJS([]);

  describe('when state is undefined', () => {
    it('returns default state', () => {
      let newState = thesaurisReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('SET_THESAURIS_UPLOADS', () => {
    it('should set the thesauris in the state', () => {
      let thesauris = [{title: 'Song of Ice and Fire: The Winds of Winter'}, {title: 'Song of Ice and Fire: A Dream of Spring'}];
      let newState = thesaurisReducer(initialState, {type: types.SET_THESAURIS_UPLOADS, thesauris});
      expect(newState).toEqualImmutable(Immutable.fromJS(thesauris));
    });
  });
});
