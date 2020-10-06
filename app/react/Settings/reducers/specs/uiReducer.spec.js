import { fromJS } from 'immutable';

import * as actions from 'app/Settings/actions/actionTypes';
import reducer from '../uiReducer';

describe('uiReducer', () => {
  describe('when state is undefined', () => {
    it('should return initial state', () => {
      const newState = reducer();
      expect(newState).toEqual(fromJS({}));
    });
  });

  describe('EDIT_LINK', () => {
    it('should set savingPage true', () => {
      const newState = reducer(fromJS({}), { type: actions.EDIT_LINK, id: 5 });
      expect(newState.toJS()).toEqual({ editingLink: 5 });
    });
  });

  describe('SAVING_NAVLINKS', () => {
    it('should set savingNavlinks true', () => {
      const newState = reducer(fromJS({}), { type: actions.SAVING_NAVLINKS });
      expect(newState.toJS()).toEqual({ savingNavlinks: true });
    });
  });

  describe('NAVLINKS_SAVED', () => {
    it('should set savingNavlinks false', () => {
      const newState = reducer(fromJS({}), { type: actions.NAVLINKS_SAVED });
      expect(newState.toJS()).toEqual({ savingNavlinks: false });
    });
  });
});
