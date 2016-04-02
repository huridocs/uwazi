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

  function testState() {
    return Immutable.fromJS({name: 'Thesauri name', values: [{label: '1'}]});
  }

  describe('ADD_THESAURI_VALUE', () => {
    it('should add a new value to the values list', () => {
      let newState = thesauriReducer(testState(), {type: types.ADD_THESAURI_VALUE});
      let expected = Immutable.fromJS({name: 'Thesauri name', values: [{label: '1'}, {label: ''}]});

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });
});
