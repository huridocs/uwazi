import {fromJS} from 'immutable';

import reducer from '../uiReducer';
import * as actions from 'app/Settings/actions/actionTypes';
import 'jasmine-immutablejs-matchers';

describe('uiReducer', () => {
  describe('when state is undefined', () => {
    it('should return initial state', () => {
      let newState = reducer();
      expect(newState).toEqual(fromJS({}));
    });
  });

  describe('EDIT_LINK', () => {
    it('should set savingPage true', () => {
      let newState = reducer(fromJS({}), {type: actions.EDIT_LINK, id: 5});
      expect(newState).toEqualImmutable(fromJS({editingLink: 5}));
    });
  });

  describe('SAVING_NAVLINKS', () => {
    it('should set savingNavlinks true', () => {
      let newState = reducer(fromJS({}), {type: actions.SAVING_NAVLINKS});
      expect(newState).toEqualImmutable(fromJS({savingNavlinks: true}));
    });
  });

  describe('NAVLINKS_SAVED', () => {
    it('should set savingNavlinks false', () => {
      let newState = reducer(fromJS({}), {type: actions.NAVLINKS_SAVED});
      expect(newState).toEqualImmutable(fromJS({savingNavlinks: false}));
    });
  });
});
