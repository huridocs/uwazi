import Immutable from 'immutable';

import thesauriReducer from '~/Thesauris/reducers/thesauriReducer';
import * as types from '~/Thesauris/actions/actionTypes';
import 'jasmine-immutablejs-matchers';

describe('thesauriReducer', () => {
  describe('when state is undefined', () => {
    it('returns initial', () => {
      let newState = thesauriReducer();
      expect(newState).toEqual(Immutable.fromJS({name: '', values: []}));
    });
  });
});
