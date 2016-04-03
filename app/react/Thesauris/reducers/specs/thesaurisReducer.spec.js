import Immutable from 'immutable';
import * as actions from '~/Thesauris/actions/thesaurisActions';

import thesaurisReducer from '~/Thesauris/reducers/thesaurisReducer';
import 'jasmine-immutablejs-matchers';

describe('thesauriReducer', () => {
  describe('when state is undefined', () => {
    it('returns initial', () => {
      let newState = thesaurisReducer();
      expect(newState).toEqual(Immutable.fromJS([]));
    });
  });

  describe('SET_THESAURIS', () => {
    it('should set the given thesauri in the state to be edited', () => {
      let thesauris = [{name: 'Edit me!', values: []}];
      let newState = thesaurisReducer(null, actions.setThesauris(thesauris));
      expect(newState).toEqual(Immutable.fromJS(thesauris));
    });
  });
});
